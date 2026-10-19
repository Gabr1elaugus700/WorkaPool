import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import { RegistrarTrocaIbcUseCase } from "../../../../../src/features/ibc/useCases/RegistrarTrocaIbc.use-case";
import { IIbcExpedicaoRepository } from "../../../../../src/features/ibc/repositories/IIbcExpedicaoRepository";
import { IIbcConciliacaoRepository } from "../../../../../src/features/ibc/repositories/IbcConciliacaoRepository";
import { IIbcCadastroRepository } from "../../../../../src/features/ibc/repositories/IIbcCadastroRepository";
import { IIbcProdutoRepository } from "../../../../../src/features/ibc/repositories/IIbcProdutoRepository";
import { AppError } from "../../../../../src/utils/AppError";
import { CreateNovoIbcData, IbcCadastroRecord } from "../../../../../src/features/ibc/types/IbcCadastro.types";
import { AlocacaoIbcRecord, CargaExpedicaoRef, CargaPedidoIbcSnapshot } from "../../../../../src/features/ibc/types/IbcExpedicao.types";

const carga = (): CargaExpedicaoRef => ({
  id: "carga-1",
  codCar: 202,
  destino: "Blumenau",
  situacao: "FECHADA",
  previsaoSaida: new Date("2026-10-12T10:00:00.000Z"),
});

const pedido = (): CargaPedidoIbcSnapshot => ({
  numPed: "10",
  codCli: "B",
  cliente: "Beta",
  quantidadeEsperadaTotal: 1,
  quantidadeEsperadaVenda: 0,
  quantidadeEsperadaEmprestimo: 1,
  ibcInvalido: false,
  posCar: 1,
});

const alocacao = (): AlocacaoIbcRecord => ({
  id: "aloc-1",
  ibcId: "ibc-out",
  cargaId: "carga-1",
  numPed: "10",
  alocadoPorId: "almox-1",
  alocadoEm: new Date("2026-10-11T12:00:00.000Z"),
  expedicaoIbcId: "exp-1",
  identificador: "H0010",
});

const entrada = (): IbcCadastroRecord => ({
  id: "ibc-in",
  identificador: "HM0009",
  tipoCadastro: "TROCA",
  aptidao: "INAPTO",
  motivoInaptidao: "AGUARDANDO_INSPECAO",
  custodia: "PATIO",
  dataLimite: new Date("2027-01-01T00:00:00.000Z"),
  primeiraInspecaoEm: null,
  baixadoEm: null,
  createdAt: new Date("2026-10-13T12:00:00.000Z"),
});

function harness(options: { destino?: "TROCA" | "FICOU"; ibcEntradaId?: string | null; vincula?: boolean } = {}) {
  const createNovoIbcs = mock.fn(async () => [entrada()]);
  const softDelete = mock.fn(async () => entrada());
  const vincularEntradaTroca = mock.fn(async () => options.vincula ?? true);
  const conciliacoes: IIbcConciliacaoRepository = {
    findPorCarga: mock.fn(async () => ({ id: "exp-1", viagemFechadaEm: null, viagemFechadaPorId: null })),
    listMarcas: mock.fn(async () => [{
      alocacaoIbcId: "aloc-1",
      destino: options.destino ?? "TROCA",
      modalidade: null,
      numPed: null,
      ibcEntradaId: options.ibcEntradaId ?? null,
    }]),
    listRetornos: mock.fn(async () => []),
    save: mock.fn(async () => undefined),
    vincularEntradaTroca,
  };
  const expedicoes = {
    getCargaByCodCar: mock.fn(async () => carga()),
    listPedidosIbcByCargaId: mock.fn(async () => [pedido()]),
    listAlocacoesByCargaId: mock.fn(async () => [alocacao()]),
  } as unknown as IIbcExpedicaoRepository;
  const cadastro = { createNovoIbcs, softDelete } as unknown as IIbcCadastroRepository;
  const produtos = {
    findById: mock.fn(async () => ({ id: "prod-1", nome: "Homologado", abreviacao: "H", createdAt: new Date(), updatedAt: new Date() })),
  } as unknown as IIbcProdutoRepository;
  return {
    useCase: new RegistrarTrocaIbcUseCase(expedicoes, conciliacoes, cadastro, produtos),
    createNovoIbcs,
    softDelete,
    vincularEntradaTroca,
  };
}

const input = {
  codCar: 202,
  actorRole: Role.ALMOX,
  alocacaoIbcId: "aloc-1",
  produtoId: "prod-1",
  dataLimite: new Date("2027-01-01T00:00:00.000Z"),
};

const hasCode = (code: string, statusCode: number) => (error: unknown) => {
  assert.ok(error instanceof AppError);
  assert.equal(error.code, code);
  assert.equal(error.statusCode, statusCode);
  return true;
};

describe("RegistrarTrocaIbcUseCase", () => {
  it("cadastra o #in como troca inapta e vincula ao #out da viagem", async () => {
    const { useCase, createNovoIbcs, vincularEntradaTroca, softDelete } = harness();
    const troca = await useCase.execute(input);
    const data = createNovoIbcs.mock.calls[0]?.arguments[0] as CreateNovoIbcData;
    assert.equal(data.tipoCadastro, "TROCA");
    assert.equal(data.aquisicao, "TROCA");
    assert.equal(data.aptidao, "INAPTO");
    assert.equal(data.motivoInaptidao, "AGUARDANDO_INSPECAO");
    assert.equal(data.custodia, "PATIO");
    assert.deepEqual(vincularEntradaTroca.mock.calls[0]?.arguments, ["aloc-1", "ibc-in"]);
    assert.equal(softDelete.mock.callCount(), 0);
    assert.deepEqual(troca, { alocacaoIbcId: "aloc-1", ibcEntradaId: "ibc-in", identificador: "HM0009" });
  });

  it("não cadastra quando o destino não é troca ou a entrada já existe", async () => {
    const semDestino = harness({ destino: "FICOU" });
    await assert.rejects(() => semDestino.useCase.execute(input), hasCode("IBC_TROCA_DESTINO", 409));
    assert.equal(semDestino.createNovoIbcs.mock.callCount(), 0);

    const jaVinculada = harness({ ibcEntradaId: "ibc-in" });
    await assert.rejects(() => jaVinculada.useCase.execute(input), hasCode("IBC_TROCA_JA_VINCULADA", 409));
    assert.equal(jaVinculada.createNovoIbcs.mock.callCount(), 0);
  });

  it("desfaz o #in quando o vínculo perde a corrida", async () => {
    const { useCase, softDelete } = harness({ vincula: false });
    await assert.rejects(() => useCase.execute(input), hasCode("IBC_TROCA_JA_VINCULADA", 409));
    assert.deepEqual(softDelete.mock.calls[0]?.arguments, ["ibc-in"]);
  });

  it("recusa papel sem escrita", async () => {
    const { useCase, createNovoIbcs } = harness();
    await assert.rejects(() => useCase.execute({ ...input, actorRole: Role.USER }), hasCode("IBC_VIAGEM_FORBIDDEN", 403));
    assert.equal(createNovoIbcs.mock.callCount(), 0);
  });
});
