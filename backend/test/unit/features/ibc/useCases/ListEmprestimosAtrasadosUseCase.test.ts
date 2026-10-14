import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Role } from "@prisma/client";
import type { IIbcEmprestimoAtrasadoRepository } from "../../../../../src/features/ibc/repositories/IIbcEmprestimoAtrasadoRepository";
import type { LinhaEmprestimoAtrasado } from "../../../../../src/features/ibc/types/EmprestimoAtrasado.types";
import { ListEmprestimosAtrasadosUseCase } from "../../../../../src/features/ibc/useCases/ListEmprestimosAtrasados.use-case";
import { AppError } from "../../../../../src/utils/AppError";

const NOW = new Date("2026-10-14T12:00:00.000Z");
const VENCIDO = new Date("2026-07-12T15:00:00.000Z");

function linha(overrides: Partial<LinhaEmprestimoAtrasado> = {}): LinhaEmprestimoAtrasado {
  const identificador = overrides.identificador ?? "HMS00001";
  return {
    id: overrides.id ?? identificador,
    identificador,
    cliente: overrides.cliente === undefined ? "Cliente A" : overrides.cliente,
    codCli: overrides.codCli === undefined ? "C1" : overrides.codCli,
    numPed: overrides.numPed ?? "1120",
    codCar: overrides.codCar ?? 500,
    codRep: overrides.codRep === undefined ? 17 : overrides.codRep,
    emprestimoVenceEm: overrides.emprestimoVenceEm === undefined ? VENCIDO : overrides.emprestimoVenceEm,
    custodia: overrides.custodia ?? "CLIENTE",
    motivoBaixa: overrides.motivoBaixa === undefined ? null : overrides.motivoBaixa,
    baixadoEm: overrides.baixadoEm === undefined ? null : overrides.baixadoEm,
    convertedToContainerId:
      overrides.convertedToContainerId === undefined ? null : overrides.convertedToContainerId,
    alocacaoEncerradaEm:
      overrides.alocacaoEncerradaEm === undefined ? null : overrides.alocacaoEncerradaEm,
  };
}

function harness(linhas: LinhaEmprestimoAtrasado[]) {
  const chamadas: Date[] = [];
  const repository: IIbcEmprestimoAtrasadoRepository = {
    listar: async (now) => {
      chamadas.push(now);
      return linhas;
    },
  };
  return { chamadas, useCase: new ListEmprestimosAtrasadosUseCase(repository) };
}

describe("ListEmprestimosAtrasadosUseCase", () => {
  it("recusa ALMOX sem ler o pool", async () => {
    const { useCase, chamadas } = harness([linha()]);
    await assert.rejects(
      () => useCase.execute({ role: Role.ALMOX, now: NOW }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, "IBC_EMPRESTIMO_ATRASADO_FORBIDDEN");
        return true;
      },
    );
    assert.deepEqual(chamadas, []);
  });

  it("devolve lista vazia para VENDAS sem codRep sem ler o pool", async () => {
    const { useCase, chamadas } = harness([linha()]);
    const resultado = await useCase.execute({ role: Role.VENDAS, now: NOW });
    assert.deepEqual(resultado.itens, []);
    assert.deepEqual(chamadas, []);
  });

  it("passa o relógio fixo e devolve só o codRep de VENDAS, mais antigo primeiro", async () => {
    const { useCase, chamadas } = harness([
      linha({ identificador: "HMS00002", codRep: 17, emprestimoVenceEm: new Date("2026-08-01T00:00:00.000Z") }),
      linha({ identificador: "HMS00001", codRep: 17 }),
      linha({ identificador: "OUTRO", codRep: 4 }),
      linha({ identificador: "VENDA", codRep: 17, motivoBaixa: "VENDA" }),
    ]);
    const resultado = await useCase.execute({ role: Role.VENDAS, codRep: 17, now: NOW });
    assert.deepEqual(chamadas, [NOW]);
    assert.deepEqual(
      resultado.itens.map((item) => item.identificador),
      ["HMS00001", "HMS00002"],
    );
  });

  it("mostra empréstimo sem codRep para LOGISTICA", async () => {
    const { useCase } = harness([
      linha({ identificador: "SEM-REP", codRep: null, cliente: null, codCli: null }),
    ]);
    const resultado = await useCase.execute({ role: Role.LOGISTICA, now: NOW });
    assert.equal(resultado.itens.length, 1);
    assert.equal(resultado.itens[0]?.codRep, null);
    assert.equal(resultado.itens[0]?.cliente, null);
    assert.equal(resultado.itens[0]?.emprestimoVenceEm.toISOString(), VENCIDO.toISOString());
  });
});
