import express, { Request, Response } from 'express';
import cors from 'cors';
import config from './config/env';
import morgan from './config/morgan';
import { errorConverter, errorHandler } from './utils/error';
import router from './router';
import { StatusCodes } from 'http-status-codes';
import { sendSuccess, sendError } from './utils/apiResponse';

const app = express();

app.use(cors({
  origin: config.client.url,  
  credentials: true,
}));

app.options('*options', cors());

if (config.env !== "test") {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}
app.use(express.json());

app.use("/v1/api", router);

app.get("/", (req: Request, res: Response) => {
  sendSuccess(res, StatusCodes.OK, 'Welcome to Mustapha\'s Paystack Future Stack Assessment');
});

app.use("*error", (req: Request, res: Response) => {
  sendError(res, StatusCodes.NOT_FOUND, 'Route Not found');
});

app.use(errorConverter);
app.use(errorHandler);

export default app;
