import express, { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import config from './config/env';
import morgan from './config/morgan';
import { errorConverter, errorHandler } from './utils/error';
import router from './router';
import { createSwaggerSpec } from './config/swagger';
import { StatusCodes } from 'http-status-codes';
import { sendSuccess, sendError } from './utils/apiResponse';
import { apiLimiter } from './middlewares/rateLimiter';

const app = express();

app.set('trust proxy', true);
app.use(helmet());
app.use(apiLimiter);

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.get('/api/swagger/json', (req: Request, res: Response) => {
  const specs = createSwaggerSpec(req);
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

app.use('/api/swagger', swaggerUi.serve);
app.get('/api/swagger', (req: Request, res: Response, next: NextFunction) => {
  const specs = createSwaggerSpec(req);
  swaggerUi.setup(specs)(req, res, next);
});

app.use('/api/v1', router);

app.get('/', (req: Request, res: Response) => {
  sendSuccess(res, StatusCodes.OK, "Welcome to Mustapha's Paystack Future Stack Assessment");
});

app.get('/health', (req: Request, res: Response) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
  };
  sendSuccess(res, StatusCodes.OK, 'Health check successful', healthCheck);
});

app.use('*error', (req: Request, res: Response) => {
  sendError(res, StatusCodes.NOT_FOUND, 'Route Not found');
});

app.use(errorConverter);
app.use(errorHandler);

export default app;
