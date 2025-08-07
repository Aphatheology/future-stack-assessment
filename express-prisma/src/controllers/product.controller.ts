import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { StatusCodes } from 'http-status-codes';
import ProductService from '../services/product.service';
import { sendSuccess } from '../utils/apiResponse';
import pick from '../utils/pick';

const productService = new ProductService();

export const createProduct = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user.userId;
  const product = await productService.createProduct(userId, req.body);
  sendSuccess(res, StatusCodes.CREATED, 'Product created successfully', product);
});

export const getProducts = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const queryDto = pick(req.query, [
    'page', 'limit', 'sortBy', 'sortOrder', 'categoryId', 'search', 'minPrice', 'maxPrice', 'inStock'
  ]);
  
  const result = await productService.getProducts(queryDto);
  sendSuccess(res, StatusCodes.OK, 'Products retrieved successfully', result);
});

export const getUserProducts = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user.userId;
  const queryDto = pick(req.query, [
    'page', 'limit', 'sortBy', 'sortOrder', 'categoryId', 'search', 'minPrice', 'maxPrice', 'inStock'
  ]);
  
  const result = await productService.getUserProducts(userId, queryDto);
  sendSuccess(res, StatusCodes.OK, 'User products retrieved successfully', result);
});

export const getProduct = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { productId } = req.params;
  const product = await productService.getProductById(productId);
  sendSuccess(res, StatusCodes.OK, 'Product retrieved successfully', product);
});

export const updateProduct = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { productId } = req.params;
  const userId = (req as any).user.userId;
  const product = await productService.updateProduct(productId, userId, req.body);
  sendSuccess(res, StatusCodes.OK, 'Product updated successfully', product);
});

export const deleteProduct = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { productId } = req.params;
  const userId = (req as any).user.userId;
  await productService.deleteProduct(productId, userId);
  sendSuccess(res, StatusCodes.NO_CONTENT, 'Product deleted successfully');
});