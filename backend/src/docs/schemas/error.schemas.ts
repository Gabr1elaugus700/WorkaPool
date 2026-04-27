import { z } from "zod";

export const errorDetailSchema = z.unknown().optional();

export const appErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: errorDetailSchema,
});

export const validationErrorSchema = z.object({
  message: z.string(),
  errors: z.array(z.unknown()),
});

export const unauthorizedErrorSchema = z.object({
  message: z.string(),
});

export const internalServerErrorSchema = z.object({
  error: z.string(),
});
