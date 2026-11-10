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
   * numa única transação serializada por prefixo. Na mesma transação, cada IBC
   * recebe a cópia dos checklists ativos do padrão de `data.produtoId`.
   */
  createNovoIbcs(
    data: CreateNovoIbcData,
    quantidade: number,
  ): Promise<IbcCadastroRecord[]>;
  /**
   * Cria o IBC destino no próximo sequencial de `data.prefixo`, vincula a origem
   * (`convertedToContainerId`), grava o histórico e copia o padrão ativo do produto
   * destino (nunca os vínculos da origem), tudo na mesma transação.
   * A origem só é vinculada se ainda estiver livre; caso contrário a transação
   * é desfeita com 409 `IBC_JA_SUBSTITUIDO`.
   */
  createDerivedIbcFromSource(data: CreateDerivedIbcData): Promise<IbcCadastroRecord>;
  listConversionHistory(ibcId: string): Promise<IbcConversionHistoryRecord[]>;
  createIbcLote(data: CreateIbcLoteData): Promise<IbcLoteRecord>;
  listActiveIbcs(): Promise<IbcCadastroRecord[]>;
  listIbcs(options: ListIbcsOptions): Promise<IbcCadastroRecord[]>;
  /**
   * Vivos WP: `baixadoEm` nulo, `motivoBaixa` nulo e `convertedToContainerId` nulo
   * (pátio + em viagem + empréstimo no cliente, sem IBC substituído).
   * Fora: soft delete, baixa de venda/troca e origem de conversão ou mudança.
   */
  countVivosWp(): Promise<number>;
  markDataLimite(ibcId: string): Promise<IbcCadastroRecord>;
  findById(id: string): Promise<IbcCadastroRecord | null>;
  updateDataLimite(id: string, dataLimite: Date): Promise<IbcCadastroRecord>;
  hasOpenAlocacao(ibcId: string): Promise<boolean>;
  softDelete(id: string): Promise<IbcCadastroRecord>;
}
