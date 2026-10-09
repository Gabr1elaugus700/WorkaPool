export type ItemAbaixoDoMinimo = { descricao: string; nota: number; notaMinima: number };

export type ListarItensAbaixoDoMinimoInput = {
  respostas: ReadonlyArray<{ descricao: string; critico: boolean; nota: number }>;
  notaMinimaCritico: number;
  mediaMinima: number;
};

/** Crítico comparado com `notaMinimaCritico`; não crítico com `mediaMinima` (aponta quem puxou a média para baixo). */
export function listarItensAbaixoDoMinimo({
  respostas,
  notaMinimaCritico,
  mediaMinima,
}: ListarItensAbaixoDoMinimoInput): ItemAbaixoDoMinimo[] {
  return respostas.flatMap(({ descricao, critico, nota }) => {
    const notaMinima = critico ? notaMinimaCritico : mediaMinima;
    return nota < notaMinima ? [{ descricao, nota, notaMinima }] : [];
  });
}
