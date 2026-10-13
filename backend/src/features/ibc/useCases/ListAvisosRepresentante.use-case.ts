import { Role } from "@prisma/client";
import type { AvisoLeituraPort } from "../repositories/AvisoRepresentanteRepository";
import { assertCanLerAvisosRepresentante } from "../permissions/assertCanLerAvisosRepresentante";
import {
  toAvisoRepresentanteDto,
  type AvisoRepresentanteDto,
} from "../mappers/avisoRepresentante.mapper";

export class ListAvisosRepresentanteUseCase {
  constructor(private readonly avisos: AvisoLeituraPort) {}

  async execute(input: {
    role: Role;
    codRep?: number;
  }): Promise<{ avisos: AvisoRepresentanteDto[] }> {
    const escopo = assertCanLerAvisosRepresentante(input.role, input.codRep);
    if (escopo.tipo === "nenhum") return { avisos: [] };
    const rows = await this.avisos.listar(
      escopo.tipo === "todas" ? { escopo: "todas" } : { escopo: "codRep", codRep: escopo.codRep },
    );
    return {
      avisos: [...rows]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map(toAvisoRepresentanteDto),
    };
  }
}
