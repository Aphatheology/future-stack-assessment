import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export const sendSuccess = <T = any>(
  res: Response,
  statusCode = StatusCodes.OK,
  message: string,
  data?: T
) => {
  const response: any = {
    status: 'success',
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  statusCode = StatusCodes.BAD_REQUEST,
  message: string,
  errors?: any
) => {
  const response: any = {
    status: 'error',
    message,
  };

  if (errors !== undefined) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};
