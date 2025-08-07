import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import config from './config/env';
import morgan from './config/morgan';
import { errorConverter, errorHandler } from './utils/error';
import router from './router';
import { specs } from './config/swagger';
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
app.use(cookieParser());

app.get('/api/swagger/json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

app.use('/api/swagger', swaggerUi.serve, swaggerUi.setup(specs));

app.use("/api/v1", router);

app.get("/", (req: Request, res: Response) => {
  sendSuccess(res, StatusCodes.OK, 'Welcome to Mustapha\'s Paystack Future Stack Assessment');
});

app.use("*error", (req: Request, res: Response) => {
  sendError(res, StatusCodes.NOT_FOUND, 'Route Not found');
});

app.use(errorConverter);
app.use(errorHandler);

export default app;
