import {
  CreateNovoIbcData,
  IbcCadastroRecord,
} from "../types/IbcCadastro.types";

export type ListIbcsOptions = {
  incluirBaixados?: boolean;
};

export interface IIbcCadastroRepository {
  findHighestIdentificador(): Promise<string | null>;
  createNovoIbc(data: CreateNovoIbcData): Promise<IbcCadastroRecord>;
  listActiveIbcs(): Promise<IbcCadastroRecord[]>;
  listIbcs(options: ListIbcsOptions): Promise<IbcCadastroRecord[]>;
  markDataLimite(ibcId: string): Promise<IbcCadastroRecord>;
  findById(id: string): Promise<IbcCadastroRecord | null>;
  updateDataLimite(id: string, dataLimite: Date): Promise<IbcCadastroRecord>;
  hasOpenAlocacao(ibcId: string): Promise<boolean>;
  softDelete(id: string): Promise<IbcCadastroRecord>;
}
