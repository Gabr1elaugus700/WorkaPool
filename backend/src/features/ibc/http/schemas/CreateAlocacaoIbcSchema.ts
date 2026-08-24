import { z } from "zod";

export const CreateAlocacaoIbcSchema = z.object({
  codCar: z.coerce.number({
    required_error: "Código da carga é obrigatório",
    invalid_type_error: "Código da carga inválido",
  }),
  numPed: z.string().min(1, "Número do pedido é obrigatório"),
  identificador: z.string().min(1, "Identificador do IBC é obrigatório"),
});

export type CreateAlocacaoIbcDTO = z.infer<typeof CreateAlocacaoIbcSchema>;
