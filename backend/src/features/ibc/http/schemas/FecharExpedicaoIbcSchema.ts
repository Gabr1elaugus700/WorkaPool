import { z } from "zod";

export const FecharExpedicaoIbcSchema = z.object({
  codCar: z.coerce.number({
    required_error: "Código da carga é obrigatório",
    invalid_type_error: "Código da carga inválido",
  }),
});

export type FecharExpedicaoIbcDTO = z.infer<typeof FecharExpedicaoIbcSchema>;
