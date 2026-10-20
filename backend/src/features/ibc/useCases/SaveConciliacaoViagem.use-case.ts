import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import { assertCanFecharViagemIbc } from "../permissions/assertCanFecharViagemIbc";
import { IIbcExpedicaoRepository } from "../repositories/IIbcExpedicaoRepository";
import { IIbcConciliacaoRepository, SalvarConciliacaoData } from "../repositories/IbcConciliacaoRepository";
import { conciliacaoViagem, DestinoConciliacaoIbc, ModalidadeConciliacaoIbc, RecusaApontamento } from "../services/conciliacaoViagem";
import { CargaPedidoIbcSnapshot } from "../types/IbcExpedicao.types";
import { loadCargaFotoExpedicao } from "./loadCargaFotoExpedicao";
import { ConciliacaoViagemView, GetConciliacaoViagemUseCase } from "./GetConciliacaoViagem.use-case";

export type SalvarConciliacaoInput = {
  codCar: number;
  actorRole: Role;
  actorId: string;
  itens: Array<{
    alocacaoIbcId: string;
    destino: DestinoConciliacaoIbc;
    numPed?: string | null;
    modalidade?: ModalidadeConciliacaoIbc | null;
  }>;
  retornosSemId: Array<{ chaveCliente: string; quantidadePapel: number; confirmouDivergencia?: boolean }>;
};

function falha(statusCode: number, code: string, message: string, details: unknown): never {
  throw new AppError({ statusCode, code, message, details });
}

export class SaveConciliacaoViagemUseCase {
  private readonly consultar: GetConciliacaoViagemUseCase;

  constructor(
    private readonly expedicoes: IIbcExpedicaoRepository,
    private readonly conciliacoes: IIbcConciliacaoRepository,
  ) {
    this.consultar = new GetConciliacaoViagemUseCase(expedicoes, conciliacoes);
  }

  async execute(input: SalvarConciliacaoInput): Promise<ConciliacaoViagemView> {
    assertCanFecharViagemIbc(input.actorRole);
    const { carga, pedidosIbc } = await loadCargaFotoExpedicao(this.expedicoes, input.codCar);
    const expedicao = await this.conciliacoes.findPorCarga(carga.id);
    if (!expedicao) falha(409, "IBC_EXPEDICAO_AUSENTE", `Carga ${input.codCar} não tem expedição IBC fechada`, { codCar: input.codCar });
    if (expedicao.viagemFechadaEm) falha(409, "IBC_VIAGEM_JA_FECHADA", "A viagem já foi fechada", { codCar: input.codCar });

    const [alocacoes, marcas] = await Promise.all([
      this.expedicoes.listAlocacoesByCargaId(carga.id),
      this.conciliacoes.listMarcas(expedicao.id),
    ]);
    const chaves = new Set(conciliacaoViagem.clientes(pedidosIbc).map((cliente) => cliente.chaveCliente));
    const entradas = new Map(marcas.map((marca) => [marca.alocacaoIbcId, marca.ibcEntradaId]));
    const pedidos = new Map(pedidosIbc.map((pedido) => [pedido.numPed, pedido]));
    const normalizado = normalizar(input, new Set(alocacoes.map((alocacao) => alocacao.id)), entradas, chaves, pedidos);
    await this.conciliacoes.save({
      expedicaoIbcId: expedicao.id,
      lancadoPorId: input.actorId,
      ...normalizado,
    });
    return this.consultar.execute({ codCar: input.codCar, actorRole: input.actorRole });
  }
}

function recusarApontamento(alocacaoIbcId: string, destino: DestinoConciliacaoIbc, motivo: RecusaApontamento): never {
  const details = { alocacaoIbcId, destino };
  if (motivo === "MODALIDADE") {
    falha(422, "IBC_CONCILIACAO_MODALIDADE", "A modalidade vem do pedido e não entra no corpo", details);
  }
  if (motivo === "FORA") {
    falha(409, "IBC_CONCILIACAO_FORA_DA_VIAGEM", "Pedido fora da viagem", details);
  }
  falha(422, "IBC_CONCILIACAO_PEDIDO", "Ficou e troca exigem um pedido elegível; retornou não tem pedido", details);
}

function normalizar(
  input: SalvarConciliacaoInput,
  alocacoes: Set<string>,
  entradas: Map<string, string | null>,
  chaves: Set<string>,
  pedidos: Map<string, CargaPedidoIbcSnapshot>,
): Pick<SalvarConciliacaoData, "marcas" | "retornos"> {
  const vistas = new Set<string>();
  const marcas = input.itens.map((item) => {
    if (vistas.has(item.alocacaoIbcId)) {
      falha(400, "IBC_CONCILIACAO_INVALID_BODY", "IBC repetido na conciliação", { alocacaoIbcId: item.alocacaoIbcId });
    }
    vistas.add(item.alocacaoIbcId);
    if (!alocacoes.has(item.alocacaoIbcId)) {
      falha(409, "IBC_CONCILIACAO_FORA_DA_VIAGEM", "IBC fora da viagem", { alocacaoIbcId: item.alocacaoIbcId });
    }
    if (entradas.get(item.alocacaoIbcId) && item.destino !== "TROCA") {
      falha(409, "IBC_TROCA_JA_VINCULADA", "A troca já tem IBC de entrada vinculado", { alocacaoIbcId: item.alocacaoIbcId });
    }
    const numPed = item.numPed ?? null;
    const resolvido = conciliacaoViagem.resolverApontamento({
      destino: item.destino,
      numPed,
      modalidade: item.modalidade ?? null,
      pedido: numPed == null ? null : pedidos.get(numPed) ?? null,
    });
    if (!resolvido.ok) recusarApontamento(item.alocacaoIbcId, item.destino, resolvido.motivo);
    return { alocacaoIbcId: item.alocacaoIbcId, destino: item.destino, modalidade: resolvido.modalidade, numPed: resolvido.numPed };
  });

  const chavesVistas = new Set<string>();
  const retornos = input.retornosSemId.map((retorno) => {
    if (chavesVistas.has(retorno.chaveCliente)) {
      falha(400, "IBC_CONCILIACAO_INVALID_BODY", "Cliente repetido na conciliação", { chaveCliente: retorno.chaveCliente });
    }
    if (!chaves.has(retorno.chaveCliente)) {
      falha(409, "IBC_CONCILIACAO_FORA_DA_VIAGEM", "Cliente fora da viagem", { chaveCliente: retorno.chaveCliente });
    }
    chavesVistas.add(retorno.chaveCliente);
    return {
      chaveCliente: retorno.chaveCliente,
      quantidadePapel: retorno.quantidadePapel,
      confirmouDivergencia: retorno.confirmouDivergencia ?? false,
    };
  });
  return { marcas, retornos };
}
