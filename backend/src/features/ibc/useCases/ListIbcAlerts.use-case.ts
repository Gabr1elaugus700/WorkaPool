import { IIbcCadastroRepository } from "../repositories/IIbcCadastroRepository";
import { IIbcInspecaoLeituraRepository } from "../repositories/IIbcInspecaoLeituraRepository";
import { ItemAbaixoDoMinimo, listarItensAbaixoDoMinimo } from "../services/listarItensAbaixoDoMinimo";
import {
  IbcAlertMotivo,
  IbcCadastroRecord,
} from "../types/IbcCadastro.types";
import { IbcAlocacaoAberta, IbcInspecaoReprovadaVigente } from "../types/IbcInspecao.types";
import { shouldMarkDataLimite } from "../utils/ibcDataLimite";

export type IbcAlertChecklistReprovado = {
  checklistModeloId: string;
  nome: string;
  mediaObtida: number | null;
  mediaMinima: number;
  itensAbaixoDoMinimo: ItemAbaixoDoMinimo[];
};

export type IbcAlertDetalhes = {
  checklists: IbcAlertChecklistReprovado[];
  alocacao?: IbcAlocacaoAberta;
};

export type IbcAlert = {
  identificador: string;
  motivo: IbcAlertMotivo;
  detalhes?: IbcAlertDetalhes;
};

type InspecoesLeitura = Pick<IIbcInspecaoLeituraRepository, "listUltimasReprovadasVinculadas" | "listAlocacoesAbertas">;

export class ListIbcAlertsUseCase {
  private readonly repository: IIbcCadastroRepository;
  private readonly inspecoes: InspecoesLeitura;

  constructor(repository: IIbcCadastroRepository, inspecoes: InspecoesLeitura) {
    this.repository = repository;
    this.inspecoes = inspecoes;
  }

  async execute(): Promise<IbcAlert[]> {
    const ibcs = await this.repository.listActiveIbcs();
    const now = new Date();
    const materializados: IbcCadastroRecord[] = [];
    for (const ibc of ibcs) {
      materializados.push(await this.materializeIfDue(ibc, now));
    }
    const reprovacoes = await this.loadReprovacoes(materializados.map((ibc) => ibc.id));

    return materializados.flatMap((ibc) => alertasDoIbc(ibc, reprovacoes.get(ibc.id)));
  }

  private async loadReprovacoes(ibcIds: string[]): Promise<Map<string, IbcAlertDetalhes>> {
    const porIbc = new Map<string, IbcAlertChecklistReprovado[]>();
    for (const reprovada of await this.inspecoes.listUltimasReprovadasVinculadas(ibcIds)) {
      porIbc.set(reprovada.ibcId, [...(porIbc.get(reprovada.ibcId) ?? []), toChecklistReprovado(reprovada)]);
    }
    if (porIbc.size === 0) return new Map();

    const alocacoes = await this.inspecoes.listAlocacoesAbertas([...porIbc.keys()]);
    return new Map(
      [...porIbc].map(([ibcId, checklists]) => {
        const alocacao = alocacoes.get(ibcId);
        return [ibcId, alocacao ? { checklists, alocacao } : { checklists }];
      }),
    );
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

function toChecklistReprovado(reprovada: IbcInspecaoReprovadaVigente): IbcAlertChecklistReprovado {
  return {
    checklistModeloId: reprovada.checklistModeloId,
    nome: reprovada.checklistNome,
    mediaObtida: reprovada.mediaObtida,
    mediaMinima: reprovada.mediaMinima,
    itensAbaixoDoMinimo: listarItensAbaixoDoMinimo(reprovada),
  };
}

/** `INSPECAO_REPROVADA` vem das inspeções (pode coexistir com `DATA_LIMITE`); o motivo gravado só cobre o caso sem reprovada vinculada. */
function alertasDoIbc(ibc: IbcCadastroRecord, reprovacao: IbcAlertDetalhes | undefined): IbcAlert[] {
  const { identificador, aptidao, motivoInaptidao } = ibc;
  const alerts: IbcAlert[] = [];
  if (aptidao === "INAPTO" && motivoInaptidao != null && motivoInaptidao !== "INSPECAO_REPROVADA") {
    alerts.push({ identificador, motivo: motivoInaptidao });
  }
  if (reprovacao) {
    alerts.push({ identificador, motivo: "INSPECAO_REPROVADA", detalhes: reprovacao });
  } else if (aptidao === "INAPTO" && motivoInaptidao === "INSPECAO_REPROVADA") {
    alerts.push({ identificador, motivo: "INSPECAO_REPROVADA" });
  }
  if (ibc.primeiraInspecaoEm == null) {
    alerts.push({ identificador, motivo: "SEM_INSPECAO" });
  }
  return alerts;
}
