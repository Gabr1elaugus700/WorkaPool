import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Role } from "@prisma/client";
import { assertCanLerEmprestimosAtrasados } from "../../../../../src/features/ibc/permissions/assertCanLerEmprestimosAtrasados";
import { AppError } from "../../../../../src/utils/AppError";

describe("assertCanLerEmprestimosAtrasados", () => {
  it("libera a lista completa para ADMIN, LOGISTICA e GERENTE_DPTO", () => {
    for (const role of [Role.ADMIN, Role.LOGISTICA, Role.GERENTE_DPTO]) {
      assert.deepEqual(assertCanLerEmprestimosAtrasados(role, 17), { tipo: "todas" });
    }
  });

  it("restringe VENDAS ao codRep inteiro positivo, inclusive 999", () => {
    assert.deepEqual(assertCanLerEmprestimosAtrasados(Role.VENDAS, 17), {
      tipo: "codRep",
      codRep: 17,
    });
    assert.deepEqual(assertCanLerEmprestimosAtrasados(Role.VENDAS, 999), {
      tipo: "codRep",
      codRep: 999,
    });
  });

  it("devolve nenhum quando o codRep de VENDAS está ausente, não é inteiro ou é ≤ 0", () => {
    for (const codRep of [undefined, 0, -1, 1.5, Number.NaN]) {
      assert.deepEqual(assertCanLerEmprestimosAtrasados(Role.VENDAS, codRep), { tipo: "nenhum" });
    }
  });

  it("recusa ALMOX, USER e MOTORISTA", () => {
    for (const role of [Role.ALMOX, Role.USER, Role.MOTORISTA]) {
      assert.throws(
        () => assertCanLerEmprestimosAtrasados(role, 17),
        (error: unknown) => {
          assert.ok(error instanceof AppError);
          assert.equal(error.statusCode, 403);
          assert.equal(error.code, "IBC_EMPRESTIMO_ATRASADO_FORBIDDEN");
          return true;
        },
      );
    }
  });
});
