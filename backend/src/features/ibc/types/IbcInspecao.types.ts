export type IbcInspecaoResultado = "APROVADA" | "REPROVADA";

export type AvaliarInspecaoIbcInput = {
  respostas: ReadonlyArray<{ nota: number; critico: boolean }>;
  notaMinimaCritico: number;
  mediaMinima: number;
};

export type AvaliacaoInspecaoIbc = {
  resultado: IbcInspecaoResultado;
  mediaObtida: number | null;
};
