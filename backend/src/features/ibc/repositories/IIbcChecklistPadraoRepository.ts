import { IbcChecklistPadraoDto } from "../types/IbcChecklist.types";

export type CreateIbcChecklistPadraoData = {
  produtoId: string;
  checklistModeloId: string;
  situacao: "ENTRADA_PATIO";
  vinculadoPorId: string;
};

export interface IIbcChecklistPadraoRepository {
  listByProduto(produtoId: string): Promise<IbcChecklistPadraoDto[]>;
  /** Retorna `null` quando o par produto + checklist + situação já existe. */
  create(data: CreateIbcChecklistPadraoData): Promise<IbcChecklistPadraoDto | null>;
  /** Retorna `false` quando não havia padrão para apagar. */
  delete(produtoId: string, checklistModeloId: string): Promise<boolean>;
}
