// src/validators/vehicleSchema.ts
import { z } from "zod";

export const vehicleSchema = z.object({
  modelo: z.string().min(1, "Modelo é obrigatório"),
  eixos: z.coerce.number().int().min(1, "Informe ao menos 1 eixo"),
  eixos_carregado: z.coerce.number().int().min(0),
  eixos_vazio: z.coerce.number().int().min(0),
  pneus: z.coerce.number().int().min(1, "Quantidade inválida de pneus"),
  capacidade_kg: z.coerce.number().int().min(100, "Capacidade mínima de 100kg"),
  consumo_medio_km_l: z.coerce.number().positive("Deve ser positivo"),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;
