import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import type { AvisoLeituraPort } from "../repositories/AvisoRepresentanteRepository";
import { assertCanLerAvisosRepresentante } from "../permissions/assertCanLerAvisosRepresentante";
import { toAvisoRepresentanteDto, type AvisoRepresentanteDto } from "../mappers/avisoRepresentante.mapper";

export class MarcarAvisoRepresentanteLidoUseCase {
  constructor(private readonly avisos: AvisoLeituraPort) {}

  async execute(input: { id: string; role: Role; codRep?: number }): Promise<AvisoRepresentanteDto> {
    const escopo = assertCanLerAvisosRepresentante(input.role, input.codRep);
    const aviso = await this.avisos.buscarPorId(input.id);
    if (!aviso) throw naoEncontrado();
    const pode = escopo.tipo === "todas" || (escopo.tipo === "codRep" && escopo.codRep === aviso.codRep);
    if (!pode) {
      throw new AppError({
        message: "Aviso de outro representante",
        statusCode: 403,
        code: "IBC_AVISO_FORBIDDEN",
      });
    }
    if (aviso.lidoEm) return toAvisoRepresentanteDto(aviso);
    const marcado = await this.avisos.marcarLido(input.id, new Date());
    if (!marcado) throw naoEncontrado();
    return toAvisoRepresentanteDto(marcado);
  }
}

function naoEncontrado(): AppError {
  return new AppError({
    message: "Aviso não encontrado",
    statusCode: 404,
    code: "IBC_AVISO_NAO_ENCONTRADO",
  });
}
