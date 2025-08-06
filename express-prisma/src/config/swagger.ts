import swaggerJsdoc from 'swagger-jsdoc';
// import { version } from '../../package.json';
import config from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Paystack Future Stack Assessment API',
      version: '1.0.0',
      description: 'API documentation for the Paystack Future Stack Assessment',
      contact: {
        name: 'Mustapha',
        email: 'aphatheology@gmail.com',
      },
    },
    servers: [
      {
        url: `${config.server.url}/api/v1`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/dtos/*.ts'],
};

export const specs = swaggerJsdoc(options);
