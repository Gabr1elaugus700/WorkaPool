import { z } from "zod";

const plateSchema = z
  .string()
  .trim()
  .min(1, "Placa é obrigatória")
  .max(10, "Placa deve ter no máximo 10 caracteres");

export const createTruckBodySchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório"),
  capacity: z.coerce.number().int().positive("Capacidade deve ser positiva"),
  plate: plateSchema,
  type: z.string().trim().min(1).optional(),
  axles: z.coerce.number().int().positive().optional(),
  active: z.boolean().optional().default(true),
});

export const updateTruckBodySchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    capacity: z.coerce.number().int().positive().optional(),
    plate: plateSchema.optional(),
    type: z.string().trim().min(1).nullable().optional(),
    axles: z.coerce.number().int().positive().nullable().optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe ao menos um campo para atualizar",
  });

export const listTrucksQuerySchema = z.object({
  active: z
    .enum(["true", "false"])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : value === "true",
    ),
});

export const truckIdParamsSchema = z.object({
  id: z.string().uuid("ID deve ser um UUID válido"),
});

export const createTruckSchema = z.object({
  body: createTruckBodySchema,
});

export const updateTruckSchema = z.object({
  params: truckIdParamsSchema,
  body: updateTruckBodySchema,
});

export const getTruckByIdSchema = z.object({
  params: truckIdParamsSchema,
});

export const listTrucksSchema = z.object({
  query: listTrucksQuerySchema,
});

export type CreateTruckDTO = z.infer<typeof createTruckBodySchema>;
export type UpdateTruckDTO = z.infer<typeof updateTruckBodySchema>;
