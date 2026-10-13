import type {
  AvisoRepresentanteRepository,
  NovoAvisoRepresentante,
  TransacaoAvisoRepresentante,
} from "../repositories/AvisoRepresentanteRepository";
import { agruparFicaramEmAvisos } from "../services/agruparFicaramEmAvisos";
import type { FicouNaViagem } from "../services/planejarFechamentoViagem";
import { resolverCodRepPedidoFechado } from "../services/resolverCodRepPedidoFechado";

const CONSUMER_NAME = "IBC_AVISO_REPRESENTANTE";

export type GerarAvisosRepresentanteInput = {
  eventId: string;
  expedicaoIbcId: string;
  codCar: number;
  ficaram: readonly FicouNaViagem[];
};

export type GerarAvisosRepresentanteResult = {
  inseridos: number;
};

type Ports = Pick<AvisoRepresentanteRepository, "executarEmTransacao">;

export class GerarAvisosRepresentanteUseCase {
  private readonly ports: Ports;

  constructor(ports?: Ports) {
    this.ports = ports ?? criarPortsPadrao();
  }

  async execute(
    input: GerarAvisosRepresentanteInput,
  ): Promise<GerarAvisosRepresentanteResult> {
    try {
      return await this.ports.executarEmTransacao((tx) => this.gerar(input, tx));
    } catch (error: unknown) {
      if (isEventoJaProcessado(error)) return { inseridos: 0 };
      throw error;
    }
  }

  private async gerar(
    input: GerarAvisosRepresentanteInput,
    tx: TransacaoAvisoRepresentante,
  ): Promise<GerarAvisosRepresentanteResult> {
    if (input.ficaram.length === 0) {
      await tx.marcarProcessado(CONSUMER_NAME, input.eventId);
      return { inseridos: 0 };
    }

    const ibcIdsEmprestimo = input.ficaram
      .filter((ficou) => ficou.modalidade === "EMPRESTIMO")
      .map((ficou) => ficou.ibcId);
    const contexto = await tx.carregarContexto(input.expedicaoIbcId, ibcIdsEmprestimo);
    if (!contexto) {
      throw new Error(
        `Expedição IBC ${input.expedicaoIbcId} não encontrada para o aviso ao representante`,
      );
    }

    const grupos = agruparFicaramEmAvisos(input.ficaram, contexto.vencimentoPorIbcId);
    const avisos: NovoAvisoRepresentante[] = [];
    for (const grupo of grupos) {
      const codRep = resolverCodRepPedidoFechado(contexto.pedidos, grupo.numPed);
      if (codRep === null) {
        console.warn(
          `Aviso ao representante: pedido ${grupo.numPed} sem codRep na carga fechada; aviso ignorado`,
        );
        continue;
      }
      avisos.push({
        ...grupo,
        expedicaoIbcId: input.expedicaoIbcId,
        codCar: input.codCar,
        codRep,
      });
    }

    const inseridos = await tx.inserirAvisos(avisos);
    await tx.marcarProcessado(CONSUMER_NAME, input.eventId);
    return { inseridos };
  }
}

function criarPortsPadrao(): Ports {
  // Lazy-load para evitar side effects de conexão SQL em testes unitários.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const modulo = require("../repositories/AvisoRepresentanteRepository") as {
    AvisoRepresentanteRepository: new () => Ports;
  };
  return new modulo.AvisoRepresentanteRepository();
}

function isEventoJaProcessado(error: unknown): boolean {
  if (codigoPrisma(error) === "P2002") return true;
  if (typeof error === "object" && error !== null && "cause" in error) {
    return codigoPrisma(error.cause) === "P2002";
  }
  return false;
}

function codigoPrisma(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error)) return null;
  return typeof error.code === "string" ? error.code : null;
}
