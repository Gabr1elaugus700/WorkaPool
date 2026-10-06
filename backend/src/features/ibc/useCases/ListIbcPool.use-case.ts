import { IIbcCadastroRepository } from "../repositories/IIbcCadastroRepository";
import { IbcCadastroRecord } from "../types/IbcCadastro.types";
import { shouldMarkDataLimite } from "../utils/ibcDataLimite";

export type ListIbcPoolInput = {
  incluirBaixados?: boolean;
};

export class ListIbcPoolUseCase {
  private readonly repository: IIbcCadastroRepository;

  constructor(repository: IIbcCadastroRepository) {
    this.repository = repository;
  }

  async execute(input: ListIbcPoolInput = {}): Promise<IbcCadastroRecord[]> {
    const incluirBaixados = input.incluirBaixados === true;
    const ibcs = incluirBaixados
      ? await this.repository.listIbcs({ incluirBaixados: true })
      : await this.repository.listActiveIbcs();

    const now = new Date();
    const result: IbcCadastroRecord[] = [];

    for (const ibc of ibcs) {
      if (shouldMarkDataLimite(ibc, now)) {
        result.push(await this.repository.markDataLimite(ibc.id));
      } else {
        result.push(ibc);
      }
    }

    return result;
  }
}
