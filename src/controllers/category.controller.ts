import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../utils/catchAsync';
import CategoryService from '../services/category.service';
import { sendSuccess } from '../utils/apiResponse';

const categoryService = new CategoryService();

export const getCategories = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const categories = await categoryService.getAllCategories();
  sendSuccess(res, StatusCodes.OK, 'Categories retrieved successfully', categories);
});
