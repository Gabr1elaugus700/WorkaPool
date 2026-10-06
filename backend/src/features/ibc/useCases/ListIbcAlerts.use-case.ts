import { IIbcCadastroRepository } from "../repositories/IIbcCadastroRepository";
import {
  IbcAlertMotivo,
  IbcCadastroRecord,
} from "../types/IbcCadastro.types";
import { shouldMarkDataLimite } from "../utils/ibcDataLimite";

export type IbcAlert = {
  identificador: string;
  motivo: IbcAlertMotivo;
};

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
      if (materialized.primeiraInspecaoEm == null) {
        alerts.push({
          identificador: materialized.identificador,
          motivo: "SEM_INSPECAO",
        });
      }
    }

    return alerts;
  }

  private async materializeIfDue(
    ibc: IbcCadastroRecord,
    now: Date,
  ): Promise<IbcCadastroRecord> {
    if (shouldMarkDataLimite(ibc, now)) {
      return this.repository.markDataLimite(ibc.id);
    }
    return ibc;
  }
}
