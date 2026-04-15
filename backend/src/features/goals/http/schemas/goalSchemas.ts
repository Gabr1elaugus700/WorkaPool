import { z } from "zod";

export const CreateGoalSchema = z.object({
  product: z.string().min(1, "O produto é obrigatório"),
  productGoal: z.number(),
  codRep: z.number().min(1, "O código do representante é obrigatório"),
  monthGoal: z.number().min(1, "O mês da meta é obrigatório").max(12, "O mês da meta deve ser entre 1 e 12"),
  yearGoal: z.number().min(1, "O ano da meta é obrigatório"),
  averagePrice: z.number().min(0, "O preço médio deve ser maior ou igual a zero"),
  cod_grp: z.string().optional(),
});

export type CreateGoalDTO = z.infer<typeof CreateGoalSchema>;