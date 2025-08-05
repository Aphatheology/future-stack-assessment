import { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sendError } from './utils/apiResponse';

const router = Router();

router.use('*error', (req: Request, res: Response) => {
  sendError(res, StatusCodes.NOT_FOUND, 'Route Not found');
});

export default router;
