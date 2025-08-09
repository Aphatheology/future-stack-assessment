import swaggerJsdoc from 'swagger-jsdoc';
import config from './env';

const createSwaggerSpec = (req?: any) => {
  const serverUrl = config.getServerUrl(req);
  
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
          url: `${serverUrl}/api/v1`,
          description: 'API server',
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

  return swaggerJsdoc(options);
};

export const specs = createSwaggerSpec();
export { createSwaggerSpec };
