import type {
  CreateIbcChecklistInput,
  IbcChecklistItemDTO,
  IbcChecklistSummaryDTO,
  IbcChecklistVinculoDTO,
} from "../types/ibcChecklist.types";

export type IbcChecklistForm = {
  nome: string;
  notaMinimaCritico: string;
  mediaMinima: string;
  itensIds: string[];
};

/** Nota de 0 a 10; aceita vírgula decimal (pt-BR). Retorna null quando inválida. */
export function parseNotaMinima(valor: string): number | null {
  const normalizado = valor.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalizado)) return null;
  const nota = Number(normalizado);
  return nota >= 0 && nota <= 10 ? nota : null;
}

export function moveItem(ids: string[], index: number, direcao: "up" | "down"): string[] {
  const destino = direcao === "up" ? index - 1 : index + 1;
  if (index < 0 || index >= ids.length || destino < 0 || destino >= ids.length) return ids;
  const copia = [...ids];
  [copia[index], copia[destino]] = [copia[destino], copia[index]];
  return copia;
}

export function listItensDisponiveis(
  itens: IbcChecklistItemDTO[],
  idsNoChecklist: string[],
): IbcChecklistItemDTO[] {
  const presentes = new Set(idsNoChecklist);
  return itens.filter((item) => item.ativo && !presentes.has(item.id));
}

export function listChecklistsDisponiveisParaVinculo(
  checklists: IbcChecklistSummaryDTO[],
  vinculos: IbcChecklistVinculoDTO[],
): IbcChecklistSummaryDTO[] {
  const vinculados = new Set(vinculos.map((vinculo) => vinculo.checklistModeloId));
  return checklists
    .filter((checklist) => checklist.ativo && !vinculados.has(checklist.id))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/** Monta o payload da API; null enquanto o formulário estiver incompleto ou inválido. */
export function buildChecklistPayload(form: IbcChecklistForm): CreateIbcChecklistInput | null {
  const nome = form.nome.trim();
  const notaMinimaCritico = parseNotaMinima(form.notaMinimaCritico);
  const mediaMinima = parseNotaMinima(form.mediaMinima);
  if (!nome || notaMinimaCritico === null || mediaMinima === null || form.itensIds.length === 0) {
    return null;
  }
  return { nome, notaMinimaCritico, mediaMinima, itensIds: [...form.itensIds] };
}
