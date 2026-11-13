import { apiFetchJson } from "@/lib/apiFetch";

export type IbcChecklistPadraoDTO = {
  checklistModeloId: string;
  nome: string;
  ativo: boolean;
  vinculadoEm: string;
  vinculadoPor: { id: string; nome: string };
};

export const ibcChecklistPadraoService = {
  list: (produtoId: string): Promise<IbcChecklistPadraoDTO[]> =>
    apiFetchJson<IbcChecklistPadraoDTO[]>(`/api/ibc/produtos/${produtoId}/checklists`),

  vincular: (produtoId: string, checklistModeloId: string): Promise<IbcChecklistPadraoDTO> =>
    apiFetchJson<IbcChecklistPadraoDTO>(`/api/ibc/produtos/${produtoId}/checklists`, {
      method: "POST",
      body: JSON.stringify({ checklistModeloId }),
    }),

  desvincular: (produtoId: string, checklistModeloId: string): Promise<void> =>
    apiFetchJson<void>(`/api/ibc/produtos/${produtoId}/checklists/${checklistModeloId}`, {
      method: "DELETE",
    }),
};
