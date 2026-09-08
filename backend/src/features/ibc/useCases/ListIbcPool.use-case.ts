import { IIbcCadastroRepository } from "../repositories/IIbcCadastroRepository";
import { IbcCadastroRecord } from "../types/IbcCadastro.types";

export type ListIbcPoolInput = {
  incluirBaixados?: boolean;
};

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function isDataLimiteDue(dataLimite: Date, now: Date): boolean {
  return startOfUtcDay(dataLimite) <= startOfUtcDay(now);
}

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
      if (
        ibc.baixadoEm == null &&
        ibc.dataLimite != null &&
        ibc.motivoInaptidao === "AGUARDANDO_INSPECAO" &&
        isDataLimiteDue(ibc.dataLimite, now)
      ) {
        result.push(await this.repository.markDataLimite(ibc.id));
      } else {
        result.push(ibc);
      }
    }

    return result;
  }
}
