// backend/src/swagger.ts
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

export function setupSwagger(app: Express) {
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'WorkaPool API',
        version: '1.0.0',
      },
      servers: [{ url: 'http://localhost:3001' }],
    },
    apis: ['src/routes/**/*.ts', 'src/controllers/**/*.ts'],
  };

  const swaggerSpec = swaggerJSDoc(options);
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
