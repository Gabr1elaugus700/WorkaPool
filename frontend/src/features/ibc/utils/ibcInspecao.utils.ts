import type { IbcChecklistDTO, IbcChecklistItemNoChecklistDTO } from "../types/ibcChecklist.types";
import type { IbcAlocacaoAbertaDTO, IbcItemAbaixoDoMinimoDTO } from "../types/ibcCadastro.types";
import type {
  IbcInspecaoLimitesDTO,
  IbcInspecaoRespostaDTO,
  RegistrarIbcInspecaoInput,
} from "../types/ibcInspecao.types";
import { formatNumber } from "@/utils/formatNumber";
import { IBC_OBSERVACAO_MAX } from "./ibcMudanca.utils";

export function listItensInspecao(checklist: IbcChecklistDTO): IbcChecklistItemNoChecklistDTO[] {
  return checklist.itens.filter((item) => item.ativo).sort((a, b) => a.ordem - b.ordem);
}

/** Nota inteira de 0 a 10; null quando em branco ou inválida. */
export function parseNotaInspecao(valor: string): number | null {
  const normalizado = valor.trim();
  if (!/^\d+$/.test(normalizado)) return null;
  const nota = Number(normalizado);
  return nota <= 10 ? nota : null;
}

/** Payload da API; null enquanto faltar nota válida em algum item ativo ou a observação exceder o limite. */
export function buildInspecaoPayload(
  checklistModeloId: string,
  itens: IbcChecklistItemNoChecklistDTO[],
  notas: Record<string, string>,
  observacao: string,
): RegistrarIbcInspecaoInput | null {
  if (itens.length === 0) return null;
  const respostas: RegistrarIbcInspecaoInput["respostas"] = [];
  for (const item of itens) {
    const nota = parseNotaInspecao(notas[item.itemId] ?? "");
    if (nota === null) return null;
    respostas.push({ checklistItemId: item.itemId, nota });
  }
  const trimmed = observacao.trim();
  if (trimmed.length > IBC_OBSERVACAO_MAX) return null;
  return trimmed.length > 0
    ? { checklistModeloId, respostas, observacao: trimmed }
    : { checklistModeloId, respostas };
}

export function formatNotaInspecao(nota: number | null): string {
  return nota === null ? "—" : formatNumber(nota);
}

/** Crítico comparado com `notaMinimaCritico`; não crítico com `mediaMinima` (mesma regra do alerta na API). */
export function notaMinimaDoItem(item: Pick<IbcInspecaoRespostaDTO, "critico">, limites: IbcInspecaoLimitesDTO): number {
  return item.critico ? limites.notaMinimaCritico : limites.mediaMinima;
}

export function isNotaAbaixoDoMinimo(
  item: Pick<IbcInspecaoRespostaDTO, "critico" | "nota">,
  limites: IbcInspecaoLimitesDTO,
): boolean {
  return item.nota < notaMinimaDoItem(item, limites);
}

export function formatMediaVsMinima(mediaObtida: number | null, mediaMinima: number): string {
  const media = mediaObtida === null ? "sem média (só críticos)" : `média ${formatNumber(mediaObtida)}`;
  return `${media} · mín. ${formatNumber(mediaMinima)}`;
}

export function formatItensAbaixoDoMinimo(itens: IbcItemAbaixoDoMinimoDTO[]): string {
  return itens
    .map(({ descricao, nota, notaMinima }) => `${descricao}: ${formatNumber(nota)} (mín. ${formatNumber(notaMinima)})`)
    .join(" · ");
}

export function formatAlocacaoAlerta({ codCar, numPed }: IbcAlocacaoAbertaDTO): string {
  return `Alocado na carga ${codCar} · pedido ${numPed}`;
}
