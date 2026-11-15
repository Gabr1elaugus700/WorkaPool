import type { ChecklistItemRespostaEsperada, ChecklistItemTipo } from "@prisma/client";

export type ItemAbaixoDoMinimoNumerico = {
  descricao: string;
  nota: number;
  notaMinima: number;
};

export type ItemAbaixoDoMinimoSimNao = {
  descricao: string;
  tipo: "SIM_NAO";
  resposta: ChecklistItemRespostaEsperada;
  respostaEsperada: ChecklistItemRespostaEsperada;
};

export type ItemAbaixoDoMinimo = ItemAbaixoDoMinimoNumerico | ItemAbaixoDoMinimoSimNao;

export type RespostaReprovacaoSnapshot = {
  descricao: string;
  tipo: ChecklistItemTipo;
  critico: boolean;
  nota: number | null;
  resposta: ChecklistItemRespostaEsperada | null;
  respostaEsperada: ChecklistItemRespostaEsperada | null;
  bloqueante: boolean | null;
};

export type ListarItensAbaixoDoMinimoInput = {
  respostas: ReadonlyArray<RespostaReprovacaoSnapshot>;
  notaMinimaCritico: number | null;
  mediaMinima: number | null;
};

/** Crítico comparado com `notaMinimaCritico`; não crítico com `mediaMinima`; sim/não bloqueante fora do esperado. */
export function listarItensAbaixoDoMinimo({
  respostas,
  notaMinimaCritico,
  mediaMinima,
}: ListarItensAbaixoDoMinimoInput): ItemAbaixoDoMinimo[] {
  const numericos: ItemAbaixoDoMinimo[] =
    notaMinimaCritico === null && mediaMinima === null
      ? []
      : respostas.flatMap((row) => {
          if (row.tipo !== "NUMERICO" || row.nota === null) return [];
          const notaMinima = row.critico ? notaMinimaCritico : mediaMinima;
          if (notaMinima === null) return [];
          return row.nota < notaMinima
            ? [{ descricao: row.descricao, nota: row.nota, notaMinima }]
            : [];
        });

  const simNaoFora: ItemAbaixoDoMinimoSimNao[] = respostas.flatMap((row) => {
    if (
      row.tipo !== "SIM_NAO" ||
      row.bloqueante !== true ||
      row.resposta === null ||
      row.respostaEsperada === null
    ) {
      return [];
    }
    return row.resposta !== row.respostaEsperada
      ? [
          {
            descricao: row.descricao,
            tipo: "SIM_NAO",
            resposta: row.resposta,
            respostaEsperada: row.respostaEsperada,
          },
        ]
      : [];
  });

  return [...numericos, ...simNaoFora];
}