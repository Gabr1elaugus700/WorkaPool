import type { FicouNaViagem } from "./planejarFechamentoViagem";

export type ItemAvisoRepresentante = {
  ibcId: string;
  identificador: string;
  modalidade: FicouNaViagem["modalidade"];
  emprestimoVenceEm: string | null;
};

export type AvisoAgrupado = {
  numPed: string;
  codCli: string | null;
  cliente: string;
  itens: ItemAvisoRepresentante[];
};

export function agruparFicaramEmAvisos(
  ficaram: readonly FicouNaViagem[],
  vencimentoPorIbcId: ReadonlyMap<string, string | null>,
): AvisoAgrupado[] {
  const grupos = new Map<string, AvisoAgrupado>();

  for (const ficou of ficaram) {
    if (ficou.modalidade !== "EMPRESTIMO") continue;
    const item: ItemAvisoRepresentante = {
      ibcId: ficou.ibcId,
      identificador: ficou.identificador,
      modalidade: ficou.modalidade,
      emprestimoVenceEm: vencimentoPorIbcId.get(ficou.ibcId) ?? null,
    };
    const grupo = grupos.get(ficou.numPed);
    if (grupo) {
      grupo.itens.push(item);
      continue;
    }
    grupos.set(ficou.numPed, {
      numPed: ficou.numPed,
      codCli: ficou.codCli,
      cliente: ficou.cliente,
      itens: [item],
    });
  }

  return [...grupos.values()];
}
