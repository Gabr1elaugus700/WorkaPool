import type {
  AvaliacaoInspecaoIbc,
  AvaliarInspecaoIbcInput,
} from "../types/IbcInspecao.types";

export function avaliarInspecaoIbc({
  respostas,
  notaMinimaCritico,
  mediaMinima,
}: AvaliarInspecaoIbcInput): AvaliacaoInspecaoIbc {
  const criticosOk = respostas
    .filter((resposta) => resposta.critico)
    .every((resposta) => resposta.nota >= notaMinimaCritico);

  const notasNaoCriticas = respostas
    .filter((resposta) => !resposta.critico)
    .map((resposta) => resposta.nota);

  const mediaObtida =
    notasNaoCriticas.length === 0
      ? null
      : notasNaoCriticas.reduce((soma, nota) => soma + nota, 0) / notasNaoCriticas.length;

  const mediaOk = mediaObtida === null || mediaObtida >= mediaMinima;

  return {
    resultado: criticosOk && mediaOk ? "APROVADA" : "REPROVADA",
    mediaObtida,
  };
}
