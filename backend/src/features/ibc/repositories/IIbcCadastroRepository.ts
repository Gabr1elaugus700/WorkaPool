import {
  CreateDerivedIbcData,
  CreateIbcLoteData,
  CreateNovoIbcData,
  IbcCadastroRecord,
  IbcConversionHistoryRecord,
  IbcLoteRecord,
} from "../types/IbcCadastro.types";

export type ListIbcsOptions = {
  incluirBaixados?: boolean;
};

export interface IIbcCadastroRepository {
  /**
   * Aloca `quantidade` sequenciais livres de `data.prefixo` e persiste os IBCs
   * numa única transação serializada por prefixo.
   */
  createNovoIbcs(
    data: CreateNovoIbcData,
    quantidade: number,
  ): Promise<IbcCadastroRecord[]>;
  /**
   * Cria o IBC destino no próximo sequencial de `data.prefixo`, vincula a origem
   * (`convertedToContainerId`) e grava o histórico, tudo na mesma transação.
   */
  createDerivedIbcFromSource(data: CreateDerivedIbcData): Promise<IbcCadastroRecord>;
  listConversionHistory(ibcId: string): Promise<IbcConversionHistoryRecord[]>;
  createIbcLote(data: CreateIbcLoteData): Promise<IbcLoteRecord>;
  listActiveIbcs(): Promise<IbcCadastroRecord[]>;
  listIbcs(options: ListIbcsOptions): Promise<IbcCadastroRecord[]>;
  /**
   * Vivos WP: baixadoEm IS NULL (pátio + em viagem + empréstimo/cliente).
   * Fora: baixados / venda já baixada no pool.
   */
  countVivosWp(): Promise<number>;
  markDataLimite(ibcId: string): Promise<IbcCadastroRecord>;
  findById(id: string): Promise<IbcCadastroRecord | null>;
  updateDataLimite(id: string, dataLimite: Date): Promise<IbcCadastroRecord>;
  hasOpenAlocacao(ibcId: string): Promise<boolean>;
  softDelete(id: string): Promise<IbcCadastroRecord>;
}
