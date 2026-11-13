import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import { assertCanManageIbcChecklists } from "../permissions/assertCanManageIbcChecklists";
import { IIbcChecklistPadraoRepository } from "../repositories/IIbcChecklistPadraoRepository";
import { IIbcProdutoRepository } from "../repositories/IIbcProdutoRepository";
import { findIbcProdutoOrThrow } from "./findIbcProdutoOrThrow";

export type DesvincularIbcChecklistPadraoInput = {
  actorRole: Role;
  produtoId: string;
  checklistModeloId: string;
};

export class DesvincularIbcChecklistPadraoUseCase {
  private readonly produtos: Pick<IIbcProdutoRepository, "findById">;
  private readonly padroes: IIbcChecklistPadraoRepository;

  constructor(produtos: Pick<IIbcProdutoRepository, "findById">, padroes: IIbcChecklistPadraoRepository) {
    this.produtos = produtos;
    this.padroes = padroes;
  }

  async execute(input: DesvincularIbcChecklistPadraoInput): Promise<void> {
    assertCanManageIbcChecklists(input.actorRole);
    await findIbcProdutoOrThrow(this.produtos, input.produtoId);

    const removido = await this.padroes.delete(input.produtoId, input.checklistModeloId);
    if (!removido) {
      throw new AppError({
        message: "Checklist não é padrão deste produto",
        statusCode: 404,
        code: "IBC_CHECKLIST_PADRAO_NOT_FOUND",
        details: { produtoId: input.produtoId, checklistModeloId: input.checklistModeloId },
      });
    }
  }
}
