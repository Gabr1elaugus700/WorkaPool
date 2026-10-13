import { z } from "zod";
import type { AvisoRepresentanteRecord } from "../repositories/AvisoRepresentanteRepository";
import { avisoRepresentanteSchemas } from "../schemas/avisoRepresentante.schemas";

export type AvisoRepresentanteDto = z.infer<typeof avisoRepresentanteSchemas.aviso>;

export function toAvisoRepresentanteDto(aviso: AvisoRepresentanteRecord): AvisoRepresentanteDto {
  return {
    id: aviso.id,
    codCar: aviso.codCar,
    numPed: aviso.numPed,
    codCli: aviso.codCli,
    cliente: aviso.cliente,
    codRep: aviso.codRep,
    itens: aviso.itens.map(({ identificador, modalidade, emprestimoVenceEm }) => ({
      identificador,
      modalidade,
      emprestimoVenceEm,
    })),
    lidoEm: aviso.lidoEm?.toISOString() ?? null,
    createdAt: aviso.createdAt.toISOString(),
  };
}
