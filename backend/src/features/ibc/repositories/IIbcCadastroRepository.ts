import {
  CreateIbcLoteData,
  CreateNovoIbcData,
  IbcStructuralChangeType,
  IbcCadastroRecord,
  IbcLoteRecord,
} from "../types/IbcCadastro.types";

export type ListIbcsOptions = {
  incluirBaixados?: boolean;
};

export interface IIbcCadastroRepository {
  findHighestIdentificadorByPrefix(prefix: string): Promise<string | null>;
  createNovoIbc(data: CreateNovoIbcData): Promise<IbcCadastroRecord>;
  createDerivedIbcFromSource(data: {
    sourceIbcId: string;
    identificador: string;
    produtoId: string | null;
    actorId: string;
    observation: string | null;
    changeType: IbcStructuralChangeType;
  }): Promise<IbcCadastroRecord>;
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
