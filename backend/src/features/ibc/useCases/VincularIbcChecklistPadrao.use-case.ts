import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import { assertCanManageIbcChecklists } from "../permissions/assertCanManageIbcChecklists";
import { IIbcChecklistRepository } from "../repositories/IIbcChecklistRepository";
import { IIbcChecklistPadraoRepository } from "../repositories/IIbcChecklistPadraoRepository";
import { IIbcProdutoRepository } from "../repositories/IIbcProdutoRepository";
import { IbcChecklistPadraoDto } from "../types/IbcChecklist.types";
import { assertChecklistIbcAtivo } from "./assertChecklistIbcAtivo";
import { findIbcProdutoOrThrow } from "./findIbcProdutoOrThrow";

export type VincularIbcChecklistPadraoInput = {
  actorRole: Role;
  actorId: string;
  produtoId: string;
  checklistModeloId: string;
};

export class VincularIbcChecklistPadraoUseCase {
  private readonly produtos: Pick<IIbcProdutoRepository, "findById">;
  private readonly checklists: Pick<IIbcChecklistRepository, "findElegibilidade">;
  private readonly padroes: IIbcChecklistPadraoRepository;

  constructor(
    produtos: Pick<IIbcProdutoRepository, "findById">,
    checklists: Pick<IIbcChecklistRepository, "findElegibilidade">,
    padroes: IIbcChecklistPadraoRepository,
  ) {
    this.produtos = produtos;
    this.checklists = checklists;
    this.padroes = padroes;
  }

  async execute(input: VincularIbcChecklistPadraoInput): Promise<IbcChecklistPadraoDto> {
    assertCanManageIbcChecklists(input.actorRole);
    await findIbcProdutoOrThrow(this.produtos, input.produtoId);
    await assertChecklistIbcAtivo(this.checklists, input.checklistModeloId);

    const padrao = await this.padroes.create({
      produtoId: input.produtoId,
      checklistModeloId: input.checklistModeloId,
      situacao: "ENTRADA_PATIO",
      vinculadoPorId: input.actorId,
    });
    if (!padrao) {
      throw new AppError({
        message: "Checklist já é padrão deste produto na Entrada no pátio",
        statusCode: 409,
        code: "IBC_CHECKLIST_PADRAO_JA_VINCULADO",
        details: { produtoId: input.produtoId, checklistModeloId: input.checklistModeloId },
      });
    }
    return padrao;
  }
}
