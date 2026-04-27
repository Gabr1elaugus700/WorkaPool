import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";
import type { RouteContract } from "./contracts";
import dotenv from "dotenv";
dotenv.config();

type SchemaObject = Record<string, unknown>;
type Components = {
  schemas: Record<string, SchemaObject>;
  securitySchemes: Record<string, SchemaObject>;
};

const jsonContentType = "application/json";

function toSchemaObject(schema: z.ZodTypeAny, name: string): SchemaObject {
  const generated = (zodToJsonSchema as unknown as Function)(schema, {
    name,
    $refStrategy: "none",
  }) as SchemaObject;
  if ("definitions" in generated && generated.definitions && typeof generated.definitions === "object") {
    const definitions = generated.definitions as Record<string, SchemaObject>;
    if (definitions[name]) {
      return definitions[name];
    }
  }
  return generated;
}

function registerSchema(
  components: Components,
  schema: z.ZodTypeAny,
  name: string
): { $ref: string } {
  if (!components.schemas[name]) {
    components.schemas[name] = toSchemaObject(schema, name);
  }
  return { $ref: `#/components/schemas/${name}` };
}

function toRequestBody(schema: SchemaObject | { $ref: string }) {
  return {
    required: true,
    content: {
      [jsonContentType]: {
        schema,
      },
    },
  };
}

function toParameterSchema(
  location: "path" | "query",
  schemaObject: SchemaObject
) {
  const properties = (schemaObject.properties ?? {}) as Record<string, SchemaObject>;
  const requiredSet = new Set((schemaObject.required ?? []) as string[]);

  return Object.entries(properties).map(([name, propertySchema]) => ({
    in: location,
    name,
    required: location === "path" ? true : requiredSet.has(name),
    schema: propertySchema,
  }));
}

export function buildOpenApiDocument(contracts: RouteContract[]) {
  const components: Components = {
    schemas: {},
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  };

  const paths: Record<string, Record<string, unknown>> = {};

  for (const contract of contracts) {
    const pathItem = (paths[contract.path] ??= {});
    const operationId = `${contract.method}_${contract.path}`
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

    const operation: Record<string, unknown> = {
      operationId,
      summary: contract.summary,
      tags: contract.tags,
      responses: {},
    };

    if (contract.description) {
      operation.description = contract.description;
    }

    if (contract.security) {
      operation.security = contract.security;
    }

    const parameters: Array<Record<string, unknown>> = [];
    if (contract.request?.params) {
      const schemaName = `${operationId}_params`;
      registerSchema(components, contract.request.params, schemaName);
      const paramsSchema = components.schemas[schemaName];
      parameters.push(...toParameterSchema("path", paramsSchema));
    }

    if (contract.request?.query) {
      const schemaName = `${operationId}_query`;
      registerSchema(components, contract.request.query, schemaName);
      const querySchema = components.schemas[schemaName];
      parameters.push(...toParameterSchema("query", querySchema));
    }

    if (parameters.length > 0) {
      operation.parameters = parameters;
    }

    if (contract.request?.body) {
      const schemaName = `${operationId}_body`;
      const bodySchemaRef = registerSchema(components, contract.request.body, schemaName);
      operation.requestBody = toRequestBody(bodySchemaRef);
    }

    const responses: Record<string, unknown> = {};
    for (const [statusCode, response] of Object.entries(contract.responses)) {
      const responseEntry: Record<string, unknown> = { description: response.description };
      if (response.schema) {
        const schemaName = response.componentName ?? `${operationId}_response_${statusCode}`;
        const responseSchemaRef = registerSchema(components, response.schema, schemaName);
        responseEntry.content = {
          [jsonContentType]: {
            schema: responseSchemaRef,
          },
        };
      }
      responses[statusCode] = responseEntry;
    }
    operation.responses = responses;

    pathItem[contract.method] = operation;
  }

  return {
    openapi: "3.0.3",
    info: {
      title: "WorkaPool API",
      version: "1.1.0",
    },
    servers: [
      { url: process.env.API_SERVER_URL + ":" + process.env.PORT }
    ],
    tags: [{ name: "Users", description: "Operações de usuários" }],
    components,
    paths,
  };
}
