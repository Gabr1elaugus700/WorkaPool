import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import { assertCanFecharViagemIbc } from "../permissions/assertCanFecharViagemIbc";
import { IIbcExpedicaoRepository } from "../repositories/IIbcExpedicaoRepository";
import {
  ExpedicaoParaConciliar,
  IIbcConciliacaoRepository,
  MarcaConciliacaoSalva,
  RetornoSemIdSalvo,
} from "../repositories/IbcConciliacaoRepository";
import {
  ClienteConciliacao,
  conciliacaoViagem,
  DestinoConciliacaoIbc,
  ModalidadeConciliacaoIbc,
  PedidoConciliacaoViagem,
} from "../services/conciliacaoViagem";
import { AlocacaoIbcRecord, CargaPedidoIbcSnapshot } from "../types/IbcExpedicao.types";
import { loadCargaFotoExpedicao } from "./loadCargaFotoExpedicao";

export type ConciliacaoViagemItem = {
  alocacaoIbcId: string;
  ibcId: string;
  identificador: string;
  numPed: string | null;
  codCli: string | null;
  cliente: string;
  destino: DestinoConciliacaoIbc | null;
  modalidade: ModalidadeConciliacaoIbc | null;
  modalidadeSugerida: ModalidadeConciliacaoIbc | null;
  ibcEntradaId: string | null;
};

export type ConciliacaoViagemCliente = ClienteConciliacao & {
  quantidadePapel: number | null;
  confirmouDivergencia: boolean;
};

export type ConciliacaoViagemView = {
  codCar: number;
  expedicaoIbcId: string;
  viagemFechadaEm: Date | null;
  viagemFechadaPorId: string | null;
  itens: ConciliacaoViagemItem[];
  pedidos: PedidoConciliacaoViagem[];
  clientes: ConciliacaoViagemCliente[];
};

export class GetConciliacaoViagemUseCase {
  constructor(
    private readonly expedicoes: IIbcExpedicaoRepository,
    private readonly conciliacoes: IIbcConciliacaoRepository,
  ) {}

  async execute(input: { codCar: number; actorRole: Role }): Promise<ConciliacaoViagemView> {
    assertCanFecharViagemIbc(input.actorRole);
    const { carga, pedidosIbc } = await loadCargaFotoExpedicao(this.expedicoes, input.codCar);
    const expedicao = await this.conciliacoes.findPorCarga(carga.id);
    if (!expedicao) {
      throw new AppError({ message: `Carga ${input.codCar} não tem expedição IBC fechada`, statusCode: 409, code: "IBC_EXPEDICAO_AUSENTE", details: { codCar: input.codCar } });
    }
    const [alocacoes, marcas, retornos] = await Promise.all([
      this.expedicoes.listAlocacoesByCargaId(carga.id),
      this.conciliacoes.listMarcas(expedicao.id),
      this.conciliacoes.listRetornos(expedicao.id),
    ]);
    return montar({ codCar: carga.codCar, expedicao, pedidos: pedidosIbc, alocacoes, marcas, retornos });
  }
}

function montar(input: {
  codCar: number;
  expedicao: ExpedicaoParaConciliar;
  pedidos: CargaPedidoIbcSnapshot[];
  alocacoes: AlocacaoIbcRecord[];
  marcas: MarcaConciliacaoSalva[];
  retornos: RetornoSemIdSalvo[];
}): ConciliacaoViagemView {
  const pedidos = new Map(input.pedidos.map((pedido) => [pedido.numPed, pedido]));
  const marcas = new Map(input.marcas.map((marca) => [marca.alocacaoIbcId, marca]));
  const retornos = new Map(input.retornos.map((retorno) => [retorno.chaveCliente, retorno]));
  const viagemFechada = input.expedicao.viagemFechadaEm != null;
  const ordenadas = input.alocacoes
    .slice()
    .sort((a, b) => a.identificador.localeCompare(b.identificador, undefined, { numeric: true }));
  const escolhas = ordenadas.map((alocacao) => {
    const marca = marcas.get(alocacao.id);
    return conciliacaoViagem.pedidoNaVolta({
      viagemFechada,
      destino: marca?.destino ?? null,
      numPedAlocacao: alocacao.numPed,
      numPedMarca: marca?.numPed ?? null,
    });
  });
  const itens = ordenadas.map((alocacao, index) => {
    const marca = marcas.get(alocacao.id);
    const numPed = escolhas[index]?.exibido ?? null;
    const pedido = numPed == null ? undefined : pedidos.get(numPed);
    const sugestao = viagemFechada && alocacao.numPed != null ? pedidos.get(alocacao.numPed) : undefined;
    return {
      alocacaoIbcId: alocacao.id,
      ibcId: alocacao.ibcId,
      identificador: alocacao.identificador,
      numPed,
      codCli: pedido?.codCli ?? null,
      cliente: pedido?.cliente ?? "",
      destino: marca?.destino ?? null,
      modalidade: marca?.modalidade ?? null,
      modalidadeSugerida: sugestao
        ? conciliacaoViagem.sugerirModalidade(sugestao.quantidadeEsperadaVenda, sugestao.quantidadeEsperadaEmprestimo)
        : null,
      ibcEntradaId: marca?.ibcEntradaId ?? null,
    };
  });
  return {
    codCar: input.codCar,
    expedicaoIbcId: input.expedicao.id,
    viagemFechadaEm: input.expedicao.viagemFechadaEm,
    viagemFechadaPorId: input.expedicao.viagemFechadaPorId,
    itens,
    pedidos: conciliacaoViagem.progressoPedidos(input.pedidos, escolhas.map((escolha) => escolha.apontado)),
    clientes: conciliacaoViagem.clientes(input.pedidos).map((cliente) => {
      const salvo = retornos.get(cliente.chaveCliente);
      return {
        ...cliente,
        quantidadePapel: salvo?.quantidadePapel ?? null,
        confirmouDivergencia: salvo?.confirmouDivergencia ?? false,
      };
    }),
  };
}
