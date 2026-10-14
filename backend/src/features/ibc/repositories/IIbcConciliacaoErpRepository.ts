import type { IbcParaConciliacaoErp } from "../types/ConciliacaoErp.types";

/** Projeção de leitura. A alocação já é a aberta mais recente. */
export type IbcLinhaConciliacaoErp = IbcParaConciliacaoErp & {
  id: string;
  /** Identificador do `#out` quando esta linha é o `#in`. */
  trocaSaidaIdentificador: string | null;
};

export interface IIbcConciliacaoErpRepository {
  listLinhas(): Promise<IbcLinhaConciliacaoErp[]>;
}
