import swaggerUi from "swagger-ui-express";
import type { Express } from "express";
import { buildOpenApiDocument } from "./openapi/buildOpenApi";
import { usersPaths } from "./paths/users.paths";

export function setupSwagger(app: Express) {
  const swaggerSpec = buildOpenApiDocument([...usersPaths]);
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
