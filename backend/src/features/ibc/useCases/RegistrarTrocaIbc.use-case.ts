import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import { assertCanFecharViagemIbc } from "../permissions/assertCanFecharViagemIbc";
import { IIbcCadastroRepository } from "../repositories/IIbcCadastroRepository";
import { IIbcConciliacaoRepository } from "../repositories/IbcConciliacaoRepository";
import { IIbcExpedicaoRepository } from "../repositories/IIbcExpedicaoRepository";
import { IIbcProdutoRepository } from "../repositories/IIbcProdutoRepository";
import { getIbcIdentifierPrefix } from "../services/getIbcIdentifierPrefix";
import { loadCargaFotoExpedicao } from "./loadCargaFotoExpedicao";

export type RegistrarTrocaIbcInput = {
  codCar: number;
  actorRole: Role;
  alocacaoIbcId: string;
  produtoId: string;
  dataLimite: Date;
};

export type TrocaIbcRegistrada = {
  alocacaoIbcId: string;
  ibcEntradaId: string;
  identificador: string;
};

function falha(statusCode: number, code: string, message: string, details?: unknown): never {
  throw new AppError({ statusCode, code, message, details });
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export class RegistrarTrocaIbcUseCase {
  constructor(
    private readonly expedicoes: IIbcExpedicaoRepository,
    private readonly conciliacoes: IIbcConciliacaoRepository,
    private readonly cadastro: IIbcCadastroRepository,
    private readonly produtos: IIbcProdutoRepository,
  ) {}

  async execute(input: RegistrarTrocaIbcInput): Promise<TrocaIbcRegistrada> {
    assertCanFecharViagemIbc(input.actorRole);
    if (startOfUtcDay(input.dataLimite) < startOfUtcDay(new Date())) {
      falha(400, "IBC_DATA_LIMITE_INVALIDA", "Data limite deve ser hoje ou uma data futura", { dataLimite: input.dataLimite });
    }
    const { carga } = await loadCargaFotoExpedicao(this.expedicoes, input.codCar);
    const expedicao = await this.conciliacoes.findPorCarga(carga.id);
    if (!expedicao) falha(409, "IBC_EXPEDICAO_AUSENTE", `Carga ${input.codCar} não tem expedição IBC fechada`, { codCar: input.codCar });
    if (expedicao.viagemFechadaEm) falha(409, "IBC_VIAGEM_JA_FECHADA", "A viagem já foi fechada", { codCar: input.codCar });

    const [alocacoes, marcas] = await Promise.all([
      this.expedicoes.listAlocacoesByCargaId(carga.id),
      this.conciliacoes.listMarcas(expedicao.id),
    ]);
    if (!alocacoes.some((alocacao) => alocacao.id === input.alocacaoIbcId)) {
      falha(409, "IBC_CONCILIACAO_FORA_DA_VIAGEM", "IBC fora da viagem", { alocacaoIbcId: input.alocacaoIbcId });
    }
    const marca = marcas.find((item) => item.alocacaoIbcId === input.alocacaoIbcId);
    if (!marca || marca.destino !== "TROCA") {
      falha(409, "IBC_TROCA_DESTINO", "Marque o IBC como troca antes de registrar a entrada", { alocacaoIbcId: input.alocacaoIbcId });
    }
    if (marca.ibcEntradaId) falha(409, "IBC_TROCA_JA_VINCULADA", "A troca já tem IBC de entrada vinculado", { alocacaoIbcId: input.alocacaoIbcId });

    const produto = await this.produtos.findById(input.produtoId);
    if (!produto) falha(404, "IBC_PRODUTO_NOT_FOUND", "Produto de container não encontrado");

    const [entrada] = await this.cadastro.createNovoIbcs({
      prefixo: getIbcIdentifierPrefix(produto.abreviacao),
      tipoCadastro: "TROCA",
      aquisicao: "TROCA",
      aptidao: "INAPTO",
      motivoInaptidao: "AGUARDANDO_INSPECAO",
      custodia: "PATIO",
      dataLimite: input.dataLimite,
      primeiraInspecaoEm: null,
      produtoId: produto.id,
    }, 1);
    if (!entrada) falha(500, "IBC_TROCA_SEM_ENTRADA", "Não foi possível registrar o IBC de entrada");
    const vinculado = await this.conciliacoes.vincularEntradaTroca(input.alocacaoIbcId, entrada.id);
    if (!vinculado) {
      await this.cadastro.softDelete(entrada.id);
      falha(409, "IBC_TROCA_JA_VINCULADA", "A troca já tem IBC de entrada vinculado", { alocacaoIbcId: input.alocacaoIbcId });
    }
    return { alocacaoIbcId: input.alocacaoIbcId, ibcEntradaId: entrada.id, identificador: entrada.identificador };
  }
}
