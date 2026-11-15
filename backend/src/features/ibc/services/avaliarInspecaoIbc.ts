import type { ChecklistItemRespostaEsperada, ChecklistItemTipo } from "@prisma/client";
import type { IbcInspecaoResultado } from "../types/IbcInspecao.types";

export type RespostaParaAvaliacao = {
  tipo: ChecklistItemTipo;
  nota: number | null;
  critico: boolean;
  resposta: ChecklistItemRespostaEsperada | null;
  respostaEsperada: ChecklistItemRespostaEsperada | null;
  bloqueante: boolean | null;
};

export type AvaliarInspecaoIbcInput = {
  respostas: ReadonlyArray<RespostaParaAvaliacao>;
  notaMinimaCritico: number | null;
  mediaMinima: number | null;
};

export type AvaliacaoInspecaoIbc = {
  resultado: IbcInspecaoResultado;
  mediaObtida: number | null;
};

export function avaliarInspecaoIbc({
  respostas,
  notaMinimaCritico,
  mediaMinima,
}: AvaliarInspecaoIbcInput): AvaliacaoInspecaoIbc {
  const numericos = respostas.filter((r) => r.tipo === "NUMERICO");

  const criticosOk =
    notaMinimaCritico === null
      ? true
      : numericos
          .filter((resposta) => resposta.critico)
          .every((resposta) => (resposta.nota ?? 0) >= notaMinimaCritico);

  const notasNaoCriticas = numericos
    .filter((resposta) => !resposta.critico)
    .map((resposta) => resposta.nota ?? 0);

  const mediaObtida =
    notasNaoCriticas.length === 0
      ? null
      : notasNaoCriticas.reduce((soma, nota) => soma + nota, 0) / notasNaoCriticas.length;

  const mediaOk =
    mediaMinima === null || mediaObtida === null || mediaObtida >= mediaMinima;

  const simNaoBloqueanteOk = respostas
    .filter((r) => r.tipo === "SIM_NAO" && r.bloqueante === true)
    .every((r) => r.resposta === r.respostaEsperada);

  return {
    resultado: criticosOk && mediaOk && simNaoBloqueanteOk ? "APROVADA" : "REPROVADA",
    mediaObtida,
  };
}