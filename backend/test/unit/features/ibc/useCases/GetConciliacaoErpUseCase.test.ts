import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import { FakeSaldoIbcErp } from "../../../../../src/features/ibc/adapters/FakeSaldoIbcErp";
import { IIbcConciliacaoErpRepository, IbcLinhaConciliacaoErp } from "../../../../../src/features/ibc/repositories/IIbcConciliacaoErpRepository";
import { GetConciliacaoErpUseCase } from "../../../../../src/features/ibc/useCases/GetConciliacaoErp.use-case";
import { SaldoIbcErpResult } from "../../../../../src/features/ibc/ports/ISaldoIbcErp";
import { AppError } from "../../../../../src/utils/AppError";

const VENCIMENTO = new Date("2026-12-01T00:00:00.000Z");

function linha(overrides: Partial<IbcLinhaConciliacaoErp> = {}): IbcLinhaConciliacaoErp {
  const identificador = overrides.identificador ?? "HMS00001";
  return {
    id: overrides.id ?? identificador,
    identificador,
    custodia: overrides.custodia ?? "PATIO",
    motivoBaixa: overrides.motivoBaixa ?? null,
    aquisicao: overrides.aquisicao ?? "COMPRA",
    baixadoEm: overrides.baixadoEm ?? null,
    convertedToContainerId: overrides.convertedToContainerId ?? null,
    loteId: overrides.loteId === undefined ? "lote-1" : overrides.loteId,
    numeroNf: overrides.numeroNf === undefined ? "NF-1" : overrides.numeroNf,
    trocaEntradaIdentificador: overrides.trocaEntradaIdentificador ?? null,
    trocaSaidaIdentificador: overrides.trocaSaidaIdentificador ?? null,
    cliente: overrides.cliente ?? null,
    codCli: overrides.codCli ?? null,
    numPed: overrides.numPed ?? null,
    emprestimoVenceEm: overrides.emprestimoVenceEm ?? null,
  };
}

function harness(ibcs: IbcLinhaConciliacaoErp[], saldo: SaldoIbcErpResult) {
  const calls: string[] = [];
  const repository: IIbcConciliacaoErpRepository = {
    listLinhas: async () => {
      calls.push("listLinhas");
      return ibcs;
    },
  };
  const saldoPort = new FakeSaldoIbcErp(() => {
    calls.push("getSaldo");
    return saldo;
  });
  return {
    calls,
    useCase: new GetConciliacaoErpUseCase(repository, saldoPort),
  };
}

const hasCode = (code: string, statusCode: number) => (error: unknown) => {
  assert.ok(error instanceof AppError);
  assert.equal(error.code, code);
  assert.equal(error.statusCode, statusCode);
  return true;
};

describe("GetConciliacaoErpUseCase", () => {
  it("recusa VENDAS, USER e MOTORISTA sem ler pool nem saldo", async () => {
    for (const role of [Role.VENDAS, Role.USER, Role.MOTORISTA]) {
      const { useCase, calls } = harness([], { status: "available", quantity: 10 });
      await assert.rejects(
        () => useCase.execute({ role }),
        hasCode("IBC_CONCILIACAO_ERP_FORBIDDEN", 403),
      );
      assert.deepEqual(calls, []);
    }
  });

  it("aceita os quatro papéis de leitura e só lista e consulta o saldo", async () => {
    for (const role of [Role.ADMIN, Role.ALMOX, Role.LOGISTICA, Role.GERENTE_DPTO]) {
      const { useCase, calls } = harness(
        [linha()],
        { status: "available", quantity: 10 },
      );
      const relatorio = await useCase.execute({ role });
      assert.deepEqual([...calls].sort(), ["getSaldo", "listLinhas"]);
      assert.equal(relatorio.vivosWp, 1);
      assert.equal(relatorio.residual, 9);
      assert.deepEqual(relatorio.itens, []);
      assert.deepEqual(relatorio.nfSemSerializar, { status: "indisponivel", count: null });
    }
  });

  it("deixa o residual nulo quando o ERP está indisponível", async () => {
    const { useCase } = harness([linha()], { status: "unavailable" });
    const relatorio = await useCase.execute({ role: Role.ALMOX });
    assert.equal(relatorio.residual, null);
    assert.equal(relatorio.vivosWp, 1);
  });

  it("lista o bucket pedido, ordenado por identificador, sem vazar pedido de pátio", async () => {
    const { useCase } = harness(
      [
        linha({
          identificador: "HMS00002",
          cliente: "Nao",
          codCli: "X",
          numPed: "1",
          emprestimoVenceEm: VENCIMENTO,
        }),
        linha({ identificador: "HMS00001" }),
        linha({
          identificador: "VENDA",
          custodia: "CLIENTE",
          motivoBaixa: "VENDA",
          cliente: "Acme",
          codCli: "C9",
          numPed: "9",
          emprestimoVenceEm: VENCIMENTO,
        }),
      ],
      { status: "available", quantity: 4 },
    );

    const relatorio = await useCase.execute({ role: Role.ALMOX, bucket: "PATIO" });

    assert.deepEqual(
      relatorio.itens.map((item) => item.identificador),
      ["HMS00001", "HMS00002"],
    );
    assert.equal(relatorio.itens[1]?.cliente, null);
    assert.equal(relatorio.itens[1]?.numPed, null);
    assert.equal(relatorio.itens[1]?.emprestimoVenceEm, null);
    assert.equal(relatorio.vivosWp, 2);
    assert.equal(relatorio.residual, 2);
  });

  it("mostra cliente, pedido e vencimento só no empréstimo, sem flag de atraso", async () => {
    const { useCase } = harness(
      [
        linha({
          identificador: "EMP",
          custodia: "CLIENTE",
          cliente: "Cliente",
          codCli: "C1",
          numPed: "42",
          emprestimoVenceEm: VENCIMENTO,
        }),
        linha({
          identificador: "VENDA",
          custodia: "CLIENTE",
          motivoBaixa: "VENDA",
          cliente: "Comprador",
          codCli: "C2",
          numPed: "7",
          emprestimoVenceEm: VENCIMENTO,
        }),
      ],
      { status: "available", quantity: 1 },
    );

    const emprestimo = await useCase.execute({ role: Role.LOGISTICA, bucket: "NO_CLIENTE" });
    const item = emprestimo.itens[0];
    assert.equal(emprestimo.itens.length, 1);
    assert.equal(item?.cliente, "Cliente");
    assert.equal(item?.codCli, "C1");
    assert.equal(item?.numPed, "42");
    assert.equal(item?.emprestimoVenceEm?.toISOString(), VENCIMENTO.toISOString());
    assert.equal("atrasado" in (item ?? {}), false);

    const vendidos = await useCase.execute({ role: Role.LOGISTICA, bucket: "VENDIDOS" });
    assert.equal(vendidos.itens[0]?.cliente, "Comprador");
    assert.equal(vendidos.itens[0]?.numPed, "7");
    assert.equal(vendidos.itens[0]?.emprestimoVenceEm, null);
  });

  it("lista o par da troca no #out e o #out no #in, e o recorte serial sem NF", async () => {
    const { useCase } = harness(
      [
        linha({
          identificador: "OUT",
          custodia: "CLIENTE",
          motivoBaixa: "TROCA",
          trocaEntradaIdentificador: "IN",
          cliente: "Par",
          numPed: "3",
        }),
        linha({
          identificador: "IN",
          custodia: "ENTRADA",
          aquisicao: "TROCA",
          trocaSaidaIdentificador: "OUT",
        }),
        linha({ identificador: "SEM", loteId: null, numeroNf: null }),
        linha({ identificador: "COM" }),
      ],
      { status: "available", quantity: 10 },
    );

    const troca = await useCase.execute({ role: Role.ADMIN, bucket: "TROCA" });
    assert.equal(troca.itens[0]?.parIdentificador, "IN");
    assert.equal(troca.itens[0]?.emprestimoVenceEm, null);

    const entrada = await useCase.execute({ role: Role.ADMIN, bucket: "ENTRADA" });
    assert.deepEqual(
      entrada.itens.map((item) => item.identificador),
      ["IN"],
    );
    assert.equal(entrada.itens[0]?.parIdentificador, "OUT");
    assert.equal(entrada.itens[0]?.bucket, "ENTRADA");

    const semNf = await useCase.execute({ role: Role.ADMIN, bucket: "SERIAL_SEM_NF" });
    assert.deepEqual(
      semNf.itens.map((item) => item.identificador),
      ["SEM"],
    );
    assert.equal(semNf.itens[0]?.bucket, "PATIO");
    assert.equal(semNf.serialSemNf.count, 1);
  });
});
