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
        version: '1.0.4',
      },
      servers: [{ url: 'http://192.168.0.32:3005' }], //atualizar em produção
    },
    apis: ['src/routes/**/*.ts', 'src/controllers/**/*.ts'],
  };

  const swaggerSpec = swaggerJSDoc(options);
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
