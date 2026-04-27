import { z } from "zod";

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export type RouteRequestSchemas = {
  params?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  body?: z.ZodTypeAny;
};

export type OpenApiResponseContract = {
  description: string;
  schema?: z.ZodTypeAny;
  componentName?: string;
};

export type RouteContract = {
  method: HttpMethod;
  path: string;
  summary: string;
  description?: string;
  tags: string[];
  security?: Array<Record<string, string[]>>;
  validationSchema?: z.ZodTypeAny;
  request?: RouteRequestSchemas;
  responses: Record<string, OpenApiResponseContract>;
};
