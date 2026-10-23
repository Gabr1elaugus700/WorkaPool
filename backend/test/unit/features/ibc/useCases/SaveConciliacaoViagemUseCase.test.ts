import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import { SaveConciliacaoViagemUseCase } from "../../../../../src/features/ibc/useCases/SaveConciliacaoViagem.use-case";
import { IIbcExpedicaoRepository } from "../../../../../src/features/ibc/repositories/IIbcExpedicaoRepository";
import {
  IIbcConciliacaoRepository,
  MarcaConciliacaoSalva,
  RetornoSemIdSalvo,
  SalvarConciliacaoData,
} from "../../../../../src/features/ibc/repositories/IbcConciliacaoRepository";
import { AppError } from "../../../../../src/utils/AppError";
import { AlocacaoIbcRecord, CargaExpedicaoRef, CargaPedidoIbcSnapshot, IbcParaCompatibilidade } from "../../../../../src/features/ibc/types/IbcExpedicao.types";
import { GruposConfiguradosLookup } from "../../../../../src/features/ibc/services/carregarCompatibilidadeDePedidos";
import { conciliacaoViagem } from "../../../../../src/features/ibc/services/conciliacaoViagem";

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
  quantidadeEsperadaVenda: 1,
  quantidadeEsperadaEmprestimo: 0,
  ibcInvalido: false,
  posCar: 1,
  gruposCodigo: [],
});

const alocacao = (): AlocacaoIbcRecord => ({
  id: "aloc-1",
  ibcId: "ibc-1",
  cargaId: "carga-1",
  numPed: "10",
  alocadoPorId: "almox-1",
  alocadoEm: new Date("2026-10-11T12:00:00.000Z"),
  expedicaoIbcId: "exp-1",
  identificador: "H0010",
});

const chave = conciliacaoViagem.chaveCliente("B", "Beta");

function harness(options: {
  fechada?: boolean;
  marcas?: MarcaConciliacaoSalva[];
  pedidos?: CargaPedidoIbcSnapshot[];
  alocacoes?: AlocacaoIbcRecord[];
  ibcs?: IbcParaCompatibilidade[];
  grupos?: GruposConfiguradosLookup;
} = {}) {
  let marcas = options.marcas ?? [];
  let retornos: RetornoSemIdSalvo[] = [];
  const save = mock.fn(async (data: SalvarConciliacaoData) => {
    marcas = data.marcas.map((marca) => ({ ...marca, ibcEntradaId: marcas.find((atual) => atual.alocacaoIbcId === marca.alocacaoIbcId)?.ibcEntradaId ?? null }));
    retornos = data.retornos;
  });
  const conciliacoes: IIbcConciliacaoRepository = {
    findPorCarga: mock.fn(async () => ({
      id: "exp-1",
      viagemFechadaEm: options.fechada ? new Date("2026-10-13T12:00:00.000Z") : null,
      viagemFechadaPorId: options.fechada ? "almox-1" : null,
    })),
    listMarcas: mock.fn(async () => marcas),
    listRetornos: mock.fn(async () => retornos),
    save,
  };
  const alocacoes = options.alocacoes ?? [alocacao()];
  const expedicoes = {
    getCargaByCodCar: mock.fn(async () => carga()),
    listPedidosIbcByCargaId: mock.fn(async () => options.pedidos ?? [pedido()]),
    listAlocacoesByCargaId: mock.fn(async () => alocacoes),
    listCompatibilidadePorIds: mock.fn(async (ids: readonly string[]) =>
      [...ids].map((id) => {
        const informado = options.ibcs?.find((ibc) => ibc.id === id);
        if (informado) return informado;
        const item = alocacoes.find((row) => row.ibcId === id);
        return {
          id,
          identificador: item?.identificador ?? id,
          universal: true,
          grupoCodigo: null,
        };
      }),
    ),
  } as unknown as IIbcExpedicaoRepository;
  return { useCase: new SaveConciliacaoViagemUseCase(expedicoes, conciliacoes, options.grupos), save };
}

const hasCode = (code: string, statusCode: number) => (error: unknown) => {
  assert.ok(error instanceof AppError);
  assert.equal(error.code, code);
  assert.equal(error.statusCode, statusCode);
  return true;
};

const input = {
  codCar: 202,
  actorRole: Role.ALMOX,
  actorId: "almox-1",
};

describe("SaveConciliacaoViagemUseCase", () => {
  it("grava o pedido apontado, deriva a venda e devolve esperado e apontado", async () => {
    const { useCase, save } = harness();
    const view = await useCase.execute({
      ...input,
      itens: [{ alocacaoIbcId: "aloc-1", destino: "FICOU", numPed: "10" }],
      retornosSemId: [{ chaveCliente: chave, quantidadePapel: 0 }],
    });
    assert.equal(save.mock.callCount(), 1);
    const gravado = save.mock.calls[0]?.arguments[0] as SalvarConciliacaoData;
    assert.equal(gravado.lancadoPorId, "almox-1");
    assert.deepEqual(gravado.marcas, [{ alocacaoIbcId: "aloc-1", destino: "FICOU", modalidade: "VENDA", numPed: "10" }]);
    assert.equal(gravado.retornos[0]?.confirmouDivergencia, false);
    assert.equal(view.itens[0]?.destino, "FICOU");
    assert.equal(view.itens[0]?.numPed, "10");
    assert.equal(view.itens[0]?.modalidade, "VENDA");
    assert.equal(view.pedidos[0]?.quantidadeEsperada, 1);
    assert.equal(view.pedidos[0]?.quantidadeApontada, 1);
    assert.equal(view.clientes[0]?.quantidadePapel, 0);
  });

  it("deriva empréstimo na troca e grava retornou sem pedido", async () => {
    const emprestimo: CargaPedidoIbcSnapshot = {
      ...pedido(),
      numPed: "20",
      quantidadeEsperadaVenda: 0,
      quantidadeEsperadaEmprestimo: 1,
    };
    const troca = harness({ pedidos: [pedido(), emprestimo] });
    const viewTroca = await troca.useCase.execute({
      ...input,
      itens: [{ alocacaoIbcId: "aloc-1", destino: "TROCA", numPed: "20" }],
      retornosSemId: [],
    });
    const gravado = troca.save.mock.calls[0]?.arguments[0] as SalvarConciliacaoData;
    assert.deepEqual(gravado.marcas, [{ alocacaoIbcId: "aloc-1", destino: "TROCA", modalidade: "EMPRESTIMO", numPed: "20" }]);
    assert.equal(viewTroca.itens[0]?.modalidade, "EMPRESTIMO");
    assert.equal(viewTroca.pedidos.find((item) => item.numPed === "20")?.quantidadeApontada, 1);

    const retorno = harness();
    const view = await retorno.useCase.execute({
      ...input,
      itens: [{ alocacaoIbcId: "aloc-1", destino: "RETORNOU" }],
      retornosSemId: [],
    });
    const semPedido = retorno.save.mock.calls[0]?.arguments[0] as SalvarConciliacaoData;
    assert.deepEqual(semPedido.marcas, [{ alocacaoIbcId: "aloc-1", destino: "RETORNOU", modalidade: null, numPed: null }]);
    assert.equal(view.itens[0]?.numPed, null);
    assert.equal(view.pedidos[0]?.quantidadeApontada, 0);
  });

  it("não grava viagem fechada, IBC de fora, modalidade inválida nem troca já vinculada", async () => {
    const fechada = harness({ fechada: true });
    await assert.rejects(
      () => fechada.useCase.execute({ ...input, itens: [], retornosSemId: [] }),
      hasCode("IBC_VIAGEM_JA_FECHADA", 409),
    );
    assert.equal(fechada.save.mock.callCount(), 0);

    const { useCase, save } = harness();
    await assert.rejects(
      () => useCase.execute({ ...input, itens: [{ alocacaoIbcId: "outra", destino: "RETORNOU" }], retornosSemId: [] }),
      hasCode("IBC_CONCILIACAO_FORA_DA_VIAGEM", 409),
    );
    await assert.rejects(
      () => useCase.execute({ ...input, itens: [{ alocacaoIbcId: "aloc-1", destino: "FICOU" }], retornosSemId: [] }),
      hasCode("IBC_CONCILIACAO_PEDIDO", 422),
    );
    await assert.rejects(
      () => useCase.execute({ ...input, itens: [{ alocacaoIbcId: "aloc-1", destino: "TROCA" }], retornosSemId: [] }),
      hasCode("IBC_CONCILIACAO_PEDIDO", 422),
    );
    await assert.rejects(
      () => useCase.execute({ ...input, itens: [{ alocacaoIbcId: "aloc-1", destino: "FICOU", numPed: "10", modalidade: "VENDA" }], retornosSemId: [] }),
      hasCode("IBC_CONCILIACAO_MODALIDADE", 422),
    );
    await assert.rejects(
      () => useCase.execute({ ...input, itens: [{ alocacaoIbcId: "aloc-1", destino: "RETORNOU", modalidade: "EMPRESTIMO" }], retornosSemId: [] }),
      hasCode("IBC_CONCILIACAO_MODALIDADE", 422),
    );
    await assert.rejects(
      () => useCase.execute({ ...input, itens: [{ alocacaoIbcId: "aloc-1", destino: "RETORNOU", numPed: "10" }], retornosSemId: [] }),
      hasCode("IBC_CONCILIACAO_PEDIDO", 422),
    );
    await assert.rejects(
      () => useCase.execute({ ...input, itens: [{ alocacaoIbcId: "aloc-1", destino: "FICOU", numPed: "99" }], retornosSemId: [] }),
      hasCode("IBC_CONCILIACAO_FORA_DA_VIAGEM", 409),
    );
    const misto = harness({
      pedidos: [{ ...pedido(), quantidadeEsperadaVenda: 1, quantidadeEsperadaEmprestimo: 1 }],
    });
    await assert.rejects(
      () => misto.useCase.execute({ ...input, itens: [{ alocacaoIbcId: "aloc-1", destino: "FICOU", numPed: "10" }], retornosSemId: [] }),
      hasCode("IBC_CONCILIACAO_PEDIDO", 422),
    );
    assert.equal(misto.save.mock.callCount(), 0);
    await assert.rejects(
      () => useCase.execute({ ...input, itens: [], retornosSemId: [{ chaveCliente: "x\u0000y", quantidadePapel: 1 }] }),
      hasCode("IBC_CONCILIACAO_FORA_DA_VIAGEM", 409),
    );
    assert.equal(save.mock.callCount(), 0);

    const vinculada = harness({
      marcas: [{ alocacaoIbcId: "aloc-1", destino: "TROCA", modalidade: null, numPed: "10", ibcEntradaId: "ibc-in" }],
    });
    await assert.rejects(
      () => vinculada.useCase.execute({ ...input, itens: [{ alocacaoIbcId: "aloc-1", destino: "RETORNOU" }], retornosSemId: [] }),
      hasCode("IBC_TROCA_JA_VINCULADA", 409),
    );
    assert.equal(vinculada.save.mock.callCount(), 0);
  });

  it("recusa papel sem escrita", async () => {
    const { useCase, save } = harness();
    await assert.rejects(
      () => useCase.execute({ ...input, actorRole: Role.USER, itens: [], retornosSemId: [] }),
      hasCode("IBC_VIAGEM_FORBIDDEN", 403),
    );
    assert.equal(save.mock.callCount(), 0);
  });
});

const gruposDe = (configurados: readonly string[]): GruposConfiguradosLookup => ({
  listGruposConfigurados: async () => [...configurados],
});

const container = (
  id: string,
  identificador: string,
  grupoCodigo: string | null,
  universal = false,
): IbcParaCompatibilidade => ({ id: `ibc-${id}`, identificador, universal, grupoCodigo });

const linha = (id: string, identificador: string): AlocacaoIbcRecord => ({
  ...alocacao(),
  id,
  ibcId: `ibc-${id}`,
  identificador,
});

const comGrupos = (numPed: string, gruposCodigo: string[], cliente = "Beta"): CargaPedidoIbcSnapshot => ({
  ...pedido(),
  numPed,
  cliente,
  codCli: cliente === "Beta" ? "B" : "C",
  posCar: numPed === "10" ? 1 : 2,
  gruposCodigo,
});

const produtoIncompativel = (
  identificador: string,
  grupoContainer: string | null,
  gruposPermitidos: string[],
) => (error: unknown) => {
  assert.ok(error instanceof AppError);
  assert.equal(error.code, "IBC_PRODUTO_INCOMPATIVEL");
  assert.equal(error.statusCode, 409);
  assert.deepEqual(error.details, { identificador, grupoContainer, gruposPermitidos });
  return true;
};

describe("SaveConciliacaoViagemUseCase compatibilidade", () => {
  const soda = [comGrupos("10", ["SODA"])];

  it("recusa cloro como ficou ou troca em pedido de soda", async () => {
    for (const destino of ["FICOU", "TROCA"] as const) {
      const { useCase, save } = harness({
        pedidos: soda,
        alocacoes: [linha("a1", "NHC00001")],
        ibcs: [container("a1", "NHC00001", "CLORO")],
        grupos: gruposDe(["SODA"]),
      });
      await assert.rejects(
        () => useCase.execute({ ...input, itens: [{ alocacaoIbcId: "a1", destino, numPed: "10" }], retornosSemId: [] }),
        produtoIncompativel("NHC00001", "CLORO", ["SODA"]),
      );
      assert.equal(save.mock.callCount(), 0);
    }
  });

  it("recusa ácido no pedido de soda mesmo com ácido na carga", async () => {
    const { useCase, save } = harness({
      pedidos: [comGrupos("10", ["SODA"]), comGrupos("20", ["ACIDO"], "Gama")],
      alocacoes: [linha("a1", "NHA00001")],
      ibcs: [container("a1", "NHA00001", "ACIDO")],
      grupos: gruposDe(["SODA", "ACIDO"]),
    });
    await assert.rejects(
      () => useCase.execute({ ...input, itens: [{ alocacaoIbcId: "a1", destino: "FICOU", numPed: "10" }], retornosSemId: [] }),
      produtoIncompativel("NHA00001", "ACIDO", ["SODA"]),
    );
    assert.equal(save.mock.callCount(), 0);
  });

  it("aceita HM e NH de soda, universal, e ácido no pedido de ácido", async () => {
    const casos = [
      { identificador: "HMS00001", grupoCodigo: "SODA" as string | null, universal: false },
      { identificador: "NHS00001", grupoCodigo: "SODA" as string | null, universal: false },
      { identificador: "NH00001", grupoCodigo: null, universal: true },
    ];
    for (const caso of casos) {
      const { useCase, save } = harness({
        pedidos: soda,
        alocacoes: [linha("a1", caso.identificador)],
        ibcs: [container("a1", caso.identificador, caso.grupoCodigo, caso.universal)],
        grupos: gruposDe(["SODA"]),
      });
      await useCase.execute({ ...input, itens: [{ alocacaoIbcId: "a1", destino: "FICOU", numPed: "10" }], retornosSemId: [] });
      assert.equal(save.mock.callCount(), 1);
    }

    const dois = harness({
      pedidos: [comGrupos("10", ["SODA"]), comGrupos("20", ["ACIDO"], "Gama")],
      alocacoes: [linha("soda", "HMS00001"), linha("acido", "NHA00001")],
      ibcs: [container("soda", "HMS00001", "SODA"), container("acido", "NHA00001", "ACIDO")],
      grupos: gruposDe(["SODA", "ACIDO"]),
    });
    await dois.useCase.execute({
      ...input,
      itens: [
        { alocacaoIbcId: "soda", destino: "FICOU", numPed: "10" },
        { alocacaoIbcId: "acido", destino: "TROCA", numPed: "20" },
      ],
      retornosSemId: [],
    });
    const gravado = dois.save.mock.calls[0]?.arguments[0] as SalvarConciliacaoData;
    assert.deepEqual(gravado.marcas.map((marca) => marca.numPed), ["10", "20"]);
  });

  it("recusa legado sem produto na volta e aceita o mesmo container como retornou", async () => {
    const legado = harness({
      pedidos: soda,
      alocacoes: [linha("a1", "HM0007")],
      grupos: gruposDe(["SODA"]),
    });
    await assert.rejects(
      () => legado.useCase.execute({ ...input, itens: [{ alocacaoIbcId: "a1", destino: "FICOU", numPed: "10" }], retornosSemId: [] }),
      produtoIncompativel("HM0007", null, ["SODA"]),
    );
    assert.equal(legado.save.mock.callCount(), 0);

    const voltou = harness({
      pedidos: soda,
      alocacoes: [linha("a1", "HM0007")],
      grupos: gruposDe(["SODA"]),
    });
    await voltou.useCase.execute({ ...input, itens: [{ alocacaoIbcId: "a1", destino: "RETORNOU" }], retornosSemId: [] });
    const gravado = voltou.save.mock.calls[0]?.arguments[0] as SalvarConciliacaoData;
    assert.deepEqual(gravado.marcas, [{ alocacaoIbcId: "a1", destino: "RETORNOU", modalidade: null, numPed: null }]);
  });

  it("pedido com grupo sem configuração só aceita universal", async () => {
    const sem = [comGrupos("10", ["SEM"])];
    const recusado = harness({
      pedidos: sem,
      alocacoes: [linha("a1", "NHSEM0001")],
      ibcs: [container("a1", "NHSEM0001", "SEM")],
      grupos: gruposDe([]),
    });
    await assert.rejects(
      () => recusado.useCase.execute({ ...input, itens: [{ alocacaoIbcId: "a1", destino: "FICOU", numPed: "10" }], retornosSemId: [] }),
      produtoIncompativel("NHSEM0001", "SEM", []),
    );
    assert.equal(recusado.save.mock.callCount(), 0);

    const universal = harness({
      pedidos: sem,
      alocacoes: [linha("a1", "NH00001")],
      ibcs: [container("a1", "NH00001", null, true)],
      grupos: gruposDe([]),
    });
    await universal.useCase.execute({ ...input, itens: [{ alocacaoIbcId: "a1", destino: "TROCA", numPed: "10" }], retornosSemId: [] });
    assert.equal(universal.save.mock.callCount(), 1);
  });
});
