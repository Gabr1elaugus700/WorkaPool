import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import { planejarFechamentoViagem } from "../../../../../src/features/ibc/services/planejarFechamentoViagem";
import { FecharViagemIbcUseCase } from "../../../../../src/features/ibc/useCases/FecharViagemIbc.use-case";
import { IIbcExpedicaoRepository } from "../../../../../src/features/ibc/repositories/IIbcExpedicaoRepository";
import { FecharViagemComando, IIbcConciliacaoRepository } from "../../../../../src/features/ibc/repositories/IbcConciliacaoRepository";
import { AbrirEntradaPatioUseCase } from "../../../../../src/features/ibc/useCases/AbrirEntradaPatio.use-case";
import { AppError } from "../../../../../src/utils/AppError";
import { MarcaConciliacaoSalva } from "../../../../../src/features/ibc/repositories/IbcConciliacaoRepository";
import { AlocacaoIbcRecord, CargaExpedicaoRef, CargaPedidoIbcSnapshot } from "../../../../../src/features/ibc/types/IbcExpedicao.types";
import { IbcConciliacaoHttpSchemas } from "../../../../../src/features/ibc/http/schemas/IbcConciliacaoSchema";

const NOW = new Date("2026-10-13T15:00:00.000Z");
const VENCE = "2027-01-11T15:00:00.000Z";

const pedido = (over: Partial<CargaPedidoIbcSnapshot> = {}): CargaPedidoIbcSnapshot => ({
  numPed: "10",
  codCli: "B",
  cliente: "Beta",
  quantidadeEsperadaTotal: 2,
  quantidadeEsperadaVenda: 2,
  quantidadeEsperadaEmprestimo: 0,
  ibcInvalido: false,
  posCar: 1,
  gruposCodigo: [],
  ...over,
});

const emprestimo = (numPed = "20"): CargaPedidoIbcSnapshot => pedido({
  numPed,
  codCli: "C",
  cliente: "Gama",
  quantidadeEsperadaTotal: 1,
  quantidadeEsperadaVenda: 0,
  quantidadeEsperadaEmprestimo: 1,
  posCar: 2,
});

const alocacao = (id: string, identificador: string, numPed: string | null = null): AlocacaoIbcRecord => ({
  id,
  ibcId: `ibc-${id}`,
  cargaId: "carga-1",
  numPed,
  alocadoPorId: "almox-1",
  alocadoEm: NOW,
  expedicaoIbcId: "exp-1",
  identificador,
});

const marca = (
  over: Partial<MarcaConciliacaoSalva> & Pick<MarcaConciliacaoSalva, "alocacaoIbcId" | "destino">,
): MarcaConciliacaoSalva => ({
  modalidade: null,
  numPed: "10",
  ibcEntradaId: null,
  ...over,
});

const hasCode = (code: string) => (error: unknown) => {
  assert.ok(error instanceof AppError);
  assert.equal(error.code, code);
  return true;
};

function plano(input: {
  alocacoes: AlocacaoIbcRecord[];
  pedidos: CargaPedidoIbcSnapshot[];
  marcas: MarcaConciliacaoSalva[];
  confirmacoes?: readonly string[];
}) {
  return planejarFechamentoViagem({ now: NOW, ...input });
}

describe("planejarFechamentoViagem", () => {
  it("exige destino em todo container da carga", () => {
    assert.throws(
      () => plano({
        alocacoes: [alocacao("a1", "H1")],
        pedidos: [pedido({ quantidadeEsperadaTotal: 1, quantidadeEsperadaVenda: 1 })],
        marcas: [],
      }),
      hasCode("IBC_VIAGEM_INCOMPLETA"),
    );
  });

  it("fecha 2/2 sem confirmação e recusa 1/2 ou 3/2 até o pedido confirmar", () => {
    const dois = [alocacao("a1", "H1"), alocacao("a2", "H2")];
    const marcasDois = [marca({ alocacaoIbcId: "a1", destino: "FICOU" }), marca({ alocacaoIbcId: "a2", destino: "FICOU" })];
    const fechado = plano({ alocacoes: dois, pedidos: [pedido()], marcas: marcasDois });
    assert.equal(fechado.efeitos.length, 2);
    assert.equal(fechado.ficaram.every((item) => item.numPed === "10"), true);

    const um = plano.bind(null, {
      alocacoes: [alocacao("a1", "H1")],
      pedidos: [pedido()],
      marcas: [marca({ alocacaoIbcId: "a1", destino: "FICOU" })],
    });
    assert.throws(um, (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.code, "IBC_DIVERGENCIA_PEDIDO");
      assert.deepEqual(error.details, {
        divergencias: [{ numPed: "10", quantidadeEsperada: 2, quantidadeApontada: 1 }],
      });
      return true;
    });
    const confirmado = plano({
      alocacoes: [alocacao("a1", "H1")],
      pedidos: [pedido()],
      marcas: [marca({ alocacaoIbcId: "a1", destino: "FICOU" })],
      confirmacoes: ["10"],
    });
    assert.equal(confirmado.efeitos.length, 1);

    const tresAloc = [alocacao("a1", "H1"), alocacao("a2", "H2"), alocacao("a3", "H3")];
    const tresMarcas = tresAloc.map((item) => marca({ alocacaoIbcId: item.id, destino: "FICOU" }));
    assert.throws(
      () => plano({ alocacoes: tresAloc, pedidos: [pedido()], marcas: tresMarcas }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, "IBC_DIVERGENCIA_PEDIDO");
        assert.deepEqual(error.details, {
          divergencias: [{ numPed: "10", quantidadeEsperada: 2, quantidadeApontada: 3 }],
        });
        return true;
      },
    );
    const tresConfirmados = plano({
      alocacoes: tresAloc,
      pedidos: [pedido()],
      marcas: tresMarcas,
      confirmacoes: ["10"],
    });
    assert.equal(tresConfirmados.efeitos.length, 3);
  });

  it("não derruba o pedido que já bate quando outro diverge", () => {
    const pedidos = [pedido(), emprestimo()];
    const alocs = [alocacao("a1", "H1"), alocacao("b1", "H2")];
    const marcas = [
      marca({ alocacaoIbcId: "a1", destino: "FICOU", numPed: "10" }),
      marca({ alocacaoIbcId: "b1", destino: "FICOU", numPed: "20" }),
    ];
    assert.throws(
      () => plano({ alocacoes: alocs, pedidos, marcas }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, "IBC_DIVERGENCIA_PEDIDO");
        assert.deepEqual(error.details, {
          divergencias: [{ numPed: "10", quantidadeEsperada: 2, quantidadeApontada: 1 }],
        });
        return true;
      },
    );
    const fechado = plano({ alocacoes: alocs, pedidos, marcas, confirmacoes: ["10"] });
    assert.deepEqual(fechado.ficaram.map((item) => item.numPed), ["10", "20"]);
    assert.equal(fechado.efeitos.find((efeito) => efeito.alocacaoIbcId === "b1")?.motivoBaixa, null);
  });

  it("recusa ficou ou troca sem pedido elegível e ignora pedido misto na conta", () => {
    const misto = pedido({
      numPed: "30",
      quantidadeEsperadaTotal: 2,
      quantidadeEsperadaVenda: 1,
      quantidadeEsperadaEmprestimo: 1,
      posCar: 3,
    });
    assert.throws(
      () => plano({
        alocacoes: [alocacao("a1", "H1")],
        pedidos: [pedido({ quantidadeEsperadaTotal: 1, quantidadeEsperadaVenda: 1 })],
        marcas: [marca({ alocacaoIbcId: "a1", destino: "FICOU", numPed: null })],
      }),
      hasCode("IBC_CONCILIACAO_PEDIDO"),
    );
    assert.throws(
      () => plano({
        alocacoes: [alocacao("a1", "H1")],
        pedidos: [misto, pedido({ quantidadeEsperadaTotal: 1, quantidadeEsperadaVenda: 1 })],
        marcas: [marca({ alocacaoIbcId: "a1", destino: "TROCA", numPed: "30", ibcEntradaId: "ibc-in" })],
      }),
      hasCode("IBC_CONCILIACAO_PEDIDO"),
    );
    const soElegivel = plano({
      alocacoes: [alocacao("a1", "H1")],
      pedidos: [misto, pedido({ quantidadeEsperadaTotal: 1, quantidadeEsperadaVenda: 1 })],
      marcas: [marca({ alocacaoIbcId: "a1", destino: "FICOU" })],
    });
    assert.equal(soElegivel.efeitos.length, 1);
  });

  it("aplica baixa sem prazo no incluso e 90 dias no empréstimo", () => {
    const fechado = plano({
      alocacoes: [alocacao("venda", "H1", "99"), alocacao("emp", "H2")],
      pedidos: [pedido({ quantidadeEsperadaTotal: 1, quantidadeEsperadaVenda: 1 }), emprestimo()],
      marcas: [
        marca({ alocacaoIbcId: "venda", destino: "FICOU", modalidade: "EMPRESTIMO", numPed: "10" }),
        marca({ alocacaoIbcId: "emp", destino: "FICOU", modalidade: "VENDA", numPed: "20" }),
      ],
    });
    const porId = new Map(fechado.efeitos.map((efeito) => [efeito.alocacaoIbcId, efeito]));
    assert.equal(porId.get("venda")?.custodia, "CLIENTE");
    assert.equal(porId.get("venda")?.motivoBaixa, "VENDA");
    assert.equal(porId.get("venda")?.emprestimoVenceEm, null);
    assert.equal(porId.get("venda")?.encerrarAlocacao, false);
    assert.equal(porId.get("emp")?.motivoBaixa, null);
    assert.equal(porId.get("emp")?.custodia, "CLIENTE");
    assert.equal(porId.get("emp")?.encerrarAlocacao, false);
    assert.equal(porId.get("emp")?.emprestimoVenceEm?.toISOString(), VENCE);
    assert.deepEqual(fechado.ficaram.map((item) => ({ numPed: item.numPed, modalidade: item.modalidade })), [
      { numPed: "10", modalidade: "VENDA" },
      { numPed: "20", modalidade: "EMPRESTIMO" },
    ]);
  });

  it("devolve o container sem cliente e aplica a regra do pedido no que ficou na troca", () => {
    const pedidos = [
      pedido({ quantidadeEsperadaTotal: 1, quantidadeEsperadaVenda: 1 }),
      emprestimo(),
    ];
    const fechado = plano({
      alocacoes: [alocacao("ret", "H1"), alocacao("troca-venda", "H2"), alocacao("troca-emp", "H3")],
      pedidos,
      marcas: [
        marca({ alocacaoIbcId: "ret", destino: "RETORNOU", numPed: null }),
        marca({ alocacaoIbcId: "troca-venda", destino: "TROCA", numPed: "10", ibcEntradaId: "ibc-in-venda" }),
        marca({ alocacaoIbcId: "troca-emp", destino: "TROCA", numPed: "20", ibcEntradaId: "ibc-in-emp" }),
      ],
    });
    const porId = new Map(fechado.efeitos.map((efeito) => [efeito.alocacaoIbcId, efeito]));
    assert.equal(porId.get("ret")?.custodia, null);
    assert.equal(porId.get("ret")?.encerrarAlocacao, true);
    assert.equal(porId.get("troca-venda")?.motivoBaixa, "VENDA");
    assert.equal(porId.get("troca-venda")?.emprestimoVenceEm, null);
    assert.equal(porId.get("troca-venda")?.trocaEntradaId, "ibc-in-venda");
    assert.equal(porId.get("troca-emp")?.motivoBaixa, null);
    assert.equal(porId.get("troca-emp")?.emprestimoVenceEm?.toISOString(), VENCE);
    assert.equal(porId.get("troca-emp")?.encerrarAlocacao, false);
    assert.equal(porId.get("troca-emp")?.trocaEntradaId, "ibc-in-emp");
    assert.deepEqual(fechado.entradas, [
      { ibcId: "ibc-ret", origem: "RETORNO" },
      { ibcId: "ibc-in-venda", origem: "TROCA" },
      { ibcId: "ibc-in-emp", origem: "TROCA" },
    ]);
    assert.deepEqual(fechado.ficaram.map((item) => item.identificador), ["H2", "H3"]);
    assert.equal(fechado.ficaram.some((item) => item.identificador === "H1"), false);
  });

  it("bloqueia troca sem o container de entrada", () => {
    assert.throws(
      () => plano({
        alocacoes: [alocacao("troca", "H4")],
        pedidos: [pedido({ quantidadeEsperadaTotal: 1, quantidadeEsperadaVenda: 1 })],
        marcas: [marca({ alocacaoIbcId: "troca", destino: "TROCA", numPed: "10", ibcEntradaId: null })],
      }),
      hasCode("IBC_TROCA_SEM_ENTRADA"),
    );
  });
});

describe("FecharViagemIbcUseCase", () => {
  const carga = {
    id: "carga-1",
    codCar: 202,
    destino: "Blumenau",
    situacao: "FECHADA",
    previsaoSaida: NOW,
  } satisfies CargaExpedicaoRef;

  function expedicoes(pedidos: CargaPedidoIbcSnapshot[], alocacoes: AlocacaoIbcRecord[]): IIbcExpedicaoRepository {
    return {
      getCargaByCodCar: async () => carga,
      listPedidosIbcByCargaId: async () => pedidos,
      listAlocacoesByCargaId: async () => alocacoes,
    } as unknown as IIbcExpedicaoRepository;
  }

  it("abre a entrada do retorno na mesma transação", async () => {
    const marcaRetorno = marca({ alocacaoIbcId: "ret", destino: "RETORNOU", numPed: null });
    let abriu = false;
    const fecharViagem = mock.fn(async (cmd: FecharViagemComando, abrir: () => Promise<void>) => {
      assert.equal(cmd.efeitos[0]?.encerrarAlocacao, true);
      assert.equal(cmd.efeitos[0]?.custodia, null);
      await abrir();
      abriu = true;
    });
    const execute = mock.fn(async () => ({ id: "entrada-1" }));
    const conciliacoes = {
      findPorCarga: async () => ({ id: "exp-1", viagemFechadaEm: null, viagemFechadaPorId: null }),
      listMarcas: async () => [marcaRetorno],
      fecharViagem,
    } as unknown as IIbcConciliacaoRepository;
    const result = await new FecharViagemIbcUseCase(
      expedicoes([pedido({ quantidadeEsperadaTotal: 1, quantidadeEsperadaVenda: 1 })], [alocacao("ret", "H3")]),
      conciliacoes,
      { execute } as unknown as AbrirEntradaPatioUseCase,
      () => NOW,
    ).execute({ codCar: 202, actorRole: Role.ADMIN, actorId: "almox-1", confirmacoes: ["10"] });
    assert.equal(abriu, true);
    assert.equal(execute.mock.callCount(), 1);
    assert.deepEqual(execute.mock.calls[0]?.arguments[0], {
      actorRole: Role.ADMIN,
      actorId: "almox-1",
      ibcId: "ibc-ret",
      origem: "RETORNO",
    });
    assert.equal(result.viagemFechadaEm, NOW);
  });

  it("não grava 1/2 sem confirmação e grava quando o pedido confirma", async () => {
    const fecharViagem = mock.fn(async (cmd: FecharViagemComando) => {
      assert.deepEqual(cmd.ficaram.map((item) => item.modalidade), ["VENDA"]);
      assert.equal(cmd.efeitos[0]?.motivoBaixa, "VENDA");
      assert.equal(cmd.efeitos[0]?.emprestimoVenceEm, null);
    });
    const conciliacoes = {
      findPorCarga: async () => ({ id: "exp-1", viagemFechadaEm: null, viagemFechadaPorId: null }),
      listMarcas: async () => [marca({ alocacaoIbcId: "a1", destino: "FICOU" })],
      fecharViagem,
    } as unknown as IIbcConciliacaoRepository;
    const useCase = new FecharViagemIbcUseCase(
      expedicoes([pedido()], [alocacao("a1", "H1")]),
      conciliacoes,
      { execute: async () => ({ id: "entrada" }) } as unknown as AbrirEntradaPatioUseCase,
      () => NOW,
    );
    await assert.rejects(
      () => useCase.execute({ codCar: 202, actorRole: Role.ALMOX, actorId: "almox-1" }),
      hasCode("IBC_DIVERGENCIA_PEDIDO"),
    );
    assert.equal(fecharViagem.mock.callCount(), 0);
    await useCase.execute({ codCar: 202, actorRole: Role.ALMOX, actorId: "almox-1", confirmacoes: ["10"] });
    assert.equal(fecharViagem.mock.callCount(), 1);
  });

  it("não reescreve viagem já fechada", async () => {
    const fecharViagem = mock.fn(async () => undefined);
    const execute = mock.fn(async () => ({ id: "entrada" }));
    const conciliacoes = {
      findPorCarga: async () => ({ id: "exp-1", viagemFechadaEm: NOW, viagemFechadaPorId: "antes" }),
      fecharViagem,
    } as unknown as IIbcConciliacaoRepository;
    await assert.rejects(
      () => new FecharViagemIbcUseCase(
        expedicoes([pedido({ quantidadeEsperadaTotal: 1, quantidadeEsperadaVenda: 1 })], []),
        conciliacoes,
        { execute } as unknown as AbrirEntradaPatioUseCase,
        () => NOW,
      ).execute({ codCar: 202, actorRole: Role.ADMIN, actorId: "almox-1" }),
      hasCode("IBC_VIAGEM_JA_FECHADA"),
    );
    assert.equal(fecharViagem.mock.callCount(), 0);
    assert.equal(execute.mock.callCount(), 0);
  });

  it("recusa papel sem escrita antes de fechar", async () => {
    const fecharViagem = mock.fn(async () => undefined);
    const conciliacoes = { fecharViagem } as unknown as IIbcConciliacaoRepository;
    await assert.rejects(
      () => new FecharViagemIbcUseCase(
        {} as IIbcExpedicaoRepository,
        conciliacoes,
        { execute: async () => ({}) } as unknown as AbrirEntradaPatioUseCase,
      ).execute({ codCar: 202, actorRole: Role.LOGISTICA, actorId: "x" }),
      hasCode("IBC_VIAGEM_FORBIDDEN"),
    );
    assert.equal(fecharViagem.mock.callCount(), 0);
  });
});

describe("IbcConciliacaoHttpSchemas.fechar", () => {
  it("aceita fechar sem corpo e exige numPed na confirmação", () => {
    assert.deepEqual(IbcConciliacaoHttpSchemas.fechar.parse({}), {});
    assert.deepEqual(
      IbcConciliacaoHttpSchemas.fechar.parse({ confirmacoes: [{ numPed: "10" }] }).confirmacoes,
      [{ numPed: "10" }],
    );
    assert.equal(IbcConciliacaoHttpSchemas.fechar.safeParse({ confirmacoes: [{ numPed: "" }] }).success, false);
  });
});
