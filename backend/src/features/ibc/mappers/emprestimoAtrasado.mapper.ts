import type { z } from "zod";
import { emprestimoAtrasadoSchemas } from "../schemas/emprestimoAtrasado.schemas";
import type { EmprestimoAtrasado } from "../types/EmprestimoAtrasado.types";

export type EmprestimoAtrasadoListaResponse = z.infer<typeof emprestimoAtrasadoSchemas.lista>;

/** O prazo gravado sai em ISO. Dias de atraso não entram no contrato. */
export function toEmprestimoAtrasadoListaResponse(
  itens: readonly EmprestimoAtrasado[],
): EmprestimoAtrasadoListaResponse {
  return {
    itens: itens.map((item) => ({
      id: item.id,
      identificador: item.identificador,
      cliente: item.cliente,
      codCli: item.codCli,
      numPed: item.numPed,
      codCar: item.codCar,
      codRep: item.codRep,
      emprestimoVenceEm: item.emprestimoVenceEm.toISOString(),
    })),
  };
}
