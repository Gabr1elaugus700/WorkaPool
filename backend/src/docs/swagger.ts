import swaggerUi from "swagger-ui-express";
import type { Express } from "express";
import { buildOpenApiDocument } from "./openapi/buildOpenApi";
import { usersPaths } from "./paths/users.paths";
import { overviewCustomerPaths } from "./paths/overviewCustomer.paths";
import { ibcPaths } from "./paths/ibc.paths";

export function setupSwagger(app: Express) {
  const swaggerSpec = buildOpenApiDocument([...usersPaths, ...overviewCustomerPaths, ...ibcPaths]);
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
