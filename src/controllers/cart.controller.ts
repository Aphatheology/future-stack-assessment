import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { StatusCodes } from 'http-status-codes';
import CartService from '../services/cart.service';
import { sendSuccess } from '../utils/apiResponse';

const cartService = new CartService();

export const getCart = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user.userId;
  const cart = await cartService.getCart(userId);
  sendSuccess(res, StatusCodes.OK, 'Cart retrieved successfully', cart);
});

export const addItem = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user.userId;
  const cart = await cartService.addItem(userId, req.body);
  sendSuccess(res, StatusCodes.CREATED, 'Item added to cart successfully', cart);
});

export const updateItem = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user.userId;
  const { productId } = req.params;
  const cart = await cartService.updateItemQuantity(userId, productId, req.body);
  sendSuccess(res, StatusCodes.OK, 'Cart item updated successfully', cart);
});

export const removeItem = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user.userId;
  const { productId } = req.params;
  const cart = await cartService.removeItem(userId, productId);
  sendSuccess(res, StatusCodes.OK, 'Cart item removed successfully', cart);
});
