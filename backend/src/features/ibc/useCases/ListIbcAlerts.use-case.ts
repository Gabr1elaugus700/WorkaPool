import { IIbcCadastroRepository } from "../repositories/IIbcCadastroRepository";
import {
  IbcCadastroRecord,
  IbcMotivoInaptidao,
} from "../types/IbcCadastro.types";

export type IbcAlert = {
  identificador: string;
  motivo: IbcMotivoInaptidao;
};

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function isDataLimiteDue(dataLimite: Date, now: Date): boolean {
  return startOfUtcDay(dataLimite) <= startOfUtcDay(now);
}

export class ListIbcAlertsUseCase {
  private readonly repository: IIbcCadastroRepository;

  constructor(repository: IIbcCadastroRepository) {
    this.repository = repository;
  }

  async execute(): Promise<IbcAlert[]> {
    const ibcs = await this.repository.listActiveIbcs();
    const now = new Date();
    const alerts: IbcAlert[] = [];

    for (const ibc of ibcs) {
      const materialized = await this.materializeIfDue(ibc, now);
      if (
        materialized.aptidao === "INAPTO" &&
        materialized.motivoInaptidao != null
      ) {
        alerts.push({
          identificador: materialized.identificador,
          motivo: materialized.motivoInaptidao,
        });
      }
    }

    return alerts;
  }

  private async materializeIfDue(
    ibc: IbcCadastroRecord,
    now: Date,
  ): Promise<IbcCadastroRecord> {
    if (
      ibc.dataLimite != null &&
      ibc.motivoInaptidao === "AGUARDANDO_INSPECAO" &&
      isDataLimiteDue(ibc.dataLimite, now)
    ) {
      return this.repository.markDataLimite(ibc.id);
    }
    return ibc;
  }
}
