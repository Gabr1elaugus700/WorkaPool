import type { IbcChecklistDTO, IbcChecklistItemNoChecklistDTO, IbcChecklistItemRespostaEsperada } from "../types/ibcChecklist.types";
import type {
  IbcAlocacaoAbertaDTO,
  IbcCadastroDTO,
  IbcItemAbaixoDoMinimoDTO,
  IbcItemAbaixoDoMinimoSimNaoDTO,
} from "../types/ibcCadastro.types";
import type {
  IbcInspecaoLimitesDTO,
  IbcInspecaoRespostaDTO,
  RegistrarIbcInspecaoInput,
} from "../types/ibcInspecao.types";
import { formatNumber } from "@/utils/formatNumber";
import { labelBloqueanteSimNao, labelRespostaSimNao } from "./ibcChecklistLabels";
import { IBC_OBSERVACAO_MAX, isIbcSubstituido } from "./ibcMudanca.utils";

/** A API recusa inspeção de IBC em viagem ou no cliente; substituído não é mais o ativo vigente. */
export function podeInspecionarIbc(ibc: Pick<IbcCadastroDTO, "custodia" | "convertedToContainerId">): boolean {
  return ibc.custodia !== "EM_VIAGEM" && ibc.custodia !== "CLIENTE" && !isIbcSubstituido(ibc);
}

export function listItensInspecao(checklist: IbcChecklistDTO): IbcChecklistItemNoChecklistDTO[] {
  return checklist.itens.filter((item) => item.ativo).sort((a, b) => a.ordem - b.ordem);
}

export function checklistInspecaoExigeMinimas(itens: IbcChecklistItemNoChecklistDTO[]): boolean {
  return itens.some((item) => item.tipo === "NUMERICO");
}

export function checklistInspecaoSemMinimasConfiguradas(
  checklist: Pick<IbcChecklistDTO, "notaMinimaCritico" | "mediaMinima">,
  itens: IbcChecklistItemNoChecklistDTO[],
): boolean {
  return (
    checklistInspecaoExigeMinimas(itens) &&
    (checklist.notaMinimaCritico === null || checklist.mediaMinima === null)
  );
}

export type InspecaoItemRascunho = {
  nota?: string;
  resposta?: IbcChecklistItemRespostaEsperada;
  observacaoItem?: string;
};

/** Nota inteira de 0 a 10; null quando em branco ou inválida. */
export function parseNotaInspecao(valor: string): number | null {
  const normalizado = valor.trim();
  if (!/^\d+$/.test(normalizado)) return null;
  const nota = Number(normalizado);
  return nota >= 0 && nota <= 10 ? nota : null;
}

export function itemRascunhoCompleto(
  item: IbcChecklistItemNoChecklistDTO,
  rascunho: InspecaoItemRascunho | undefined,
): boolean {
  if (item.tipo === "NUMERICO") {
    return parseNotaInspecao(rascunho?.nota ?? "") !== null;
  }
  return rascunho?.resposta === "SIM" || rascunho?.resposta === "NAO";
}

export function countItensInspecaoPreenchidos(
  itens: IbcChecklistItemNoChecklistDTO[],
  rascunhos: Record<string, InspecaoItemRascunho>,
): number {
  return itens.filter((item) => itemRascunhoCompleto(item, rascunhos[item.itemId])).length;
}

/** Payload da API; null enquanto faltar resposta válida em algum item ativo ou observação exceder o limite. */
export function buildInspecaoPayload(
  checklistModeloId: string,
  itens: IbcChecklistItemNoChecklistDTO[],
  rascunhos: Record<string, InspecaoItemRascunho>,
  observacaoChecklist: string,
): RegistrarIbcInspecaoInput | null {
  if (itens.length === 0) return null;

  const respostas: RegistrarIbcInspecaoInput["respostas"] = [];
  for (const item of itens) {
    const rascunho = rascunhos[item.itemId] ?? {};
    if (item.tipo === "NUMERICO") {
      const nota = parseNotaInspecao(rascunho.nota ?? "");
      if (nota === null) return null;
      respostas.push({ checklistItemId: item.itemId, nota });
      continue;
    }

    if (rascunho.resposta !== "SIM" && rascunho.resposta !== "NAO") return null;
    const obsTrim = (rascunho.observacaoItem ?? "").trim();
    if (obsTrim.length > IBC_OBSERVACAO_MAX) return null;
    const entrada: RegistrarIbcInspecaoInput["respostas"][number] = {
      checklistItemId: item.itemId,
      resposta: rascunho.resposta,
    };
    if (obsTrim.length > 0) entrada.observacao = obsTrim;
    respostas.push(entrada);
  }

  const trimmed = observacaoChecklist.trim();
  if (trimmed.length > IBC_OBSERVACAO_MAX) return null;
  return trimmed.length > 0
    ? { checklistModeloId, respostas, observacao: trimmed }
    : { checklistModeloId, respostas };
}

export function formatNotaInspecao(nota: number | null): string {
  return nota === null ? "—" : formatNumber(nota);
}

/** Crítico comparado com `notaMinimaCritico`; não crítico com `mediaMinima` (mesma regra do alerta na API). */
export function notaMinimaDoItem(
  item: Pick<IbcInspecaoRespostaDTO, "tipo" | "critico">,
  limites: IbcInspecaoLimitesDTO,
): number | null {
  if (item.tipo !== "NUMERICO") return null;
  return item.critico ? limites.notaMinimaCritico : limites.mediaMinima;
}

export function isRespostaNumericaAbaixoDoMinimo(
  resposta: Pick<IbcInspecaoRespostaDTO, "tipo" | "critico" | "nota">,
  limites: IbcInspecaoLimitesDTO,
): boolean {
  if (resposta.tipo !== "NUMERICO" || resposta.nota === null) return false;
  const minima = notaMinimaDoItem(resposta, limites);
  if (minima === null) return false;
  return resposta.nota < minima;
}

/** @deprecated Use isRespostaNumericaAbaixoDoMinimo */
export function isNotaAbaixoDoMinimo(
  item: Pick<IbcInspecaoRespostaDTO, "tipo" | "critico" | "nota">,
  limites: IbcInspecaoLimitesDTO,
): boolean {
  return isRespostaNumericaAbaixoDoMinimo(item, limites);
}

export function simNaoBloqueanteForaDoEsperado(
  resposta: Pick<
    IbcInspecaoRespostaDTO,
    "tipo" | "bloqueante" | "resposta" | "respostaEsperada"
  >,
): boolean {
  if (resposta.tipo !== "SIM_NAO") return false;
  if (resposta.bloqueante !== true) return false;
  if (resposta.resposta === null || resposta.respostaEsperada === null) return false;
  return resposta.resposta !== resposta.respostaEsperada;
}

export function formatMediaVsMinima(mediaObtida: number | null, mediaMinima: number | null): string {
  const media =
    mediaObtida === null ? "sem média (só críticos)" : `média ${formatNumber(mediaObtida)}`;
  if (mediaMinima === null) return media;
  return `${media} · mín. ${formatNumber(mediaMinima)}`;
}

export function formatLimitesInspecaoHistorico(limites: IbcInspecaoLimitesDTO): string | null {
  if (limites.notaMinimaCritico === null && limites.mediaMinima === null) {
    return "Avaliação por sim/não bloqueante";
  }
  const partes: string[] = [];
  if (limites.notaMinimaCritico !== null) {
    partes.push(`crítico mín. ${formatNotaInspecao(limites.notaMinimaCritico)}`);
  }
  if (limites.mediaMinima !== null) {
    partes.push(`média mín. ${formatNotaInspecao(limites.mediaMinima)}`);
  }
  return partes.join(" · ");
}

export function formatRespostaInspecaoHistorico(resposta: IbcInspecaoRespostaDTO): string {
  if (resposta.tipo === "NUMERICO") {
    return formatNotaInspecao(resposta.nota);
  }
  const registrada = resposta.resposta ? labelRespostaSimNao(resposta.resposta) : "—";
  const esperada = resposta.respostaEsperada
    ? `esperado ${labelRespostaSimNao(resposta.respostaEsperada)}`
    : null;
  const bloqueante =
    resposta.bloqueante != null ? `bloqueante: ${labelBloqueanteSimNao(resposta.bloqueante)}` : null;
  return [registrada, esperada, bloqueante].filter(Boolean).join(" · ");
}

function isItemReprovacaoSimNao(item: IbcItemAbaixoDoMinimoDTO): item is IbcItemAbaixoDoMinimoSimNaoDTO {
  return "tipo" in item && item.tipo === "SIM_NAO";
}

export function formatItemReprovacaoInspecao(item: IbcItemAbaixoDoMinimoDTO): string {
  if (isItemReprovacaoSimNao(item)) {
    return `${item.descricao}: ${labelRespostaSimNao(item.resposta)} (esperado ${labelRespostaSimNao(item.respostaEsperada)})`;
  }
  return `${item.descricao}: ${formatNumber(item.nota)} (mín. ${formatNumber(item.notaMinima)})`;
}

export function formatItensAbaixoDoMinimo(itens: IbcItemAbaixoDoMinimoDTO[]): string {
  return itens.map(formatItemReprovacaoInspecao).join(" · ");
}

export function formatAlocacaoAlerta({ codCar, numPed }: IbcAlocacaoAbertaDTO): string {
  return `Alocado na carga ${codCar} · pedido ${numPed}`;
}