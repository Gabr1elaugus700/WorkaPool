import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ibcEmprestimoAtrasadoPermissions } from "./ibcEmprestimoAtrasadoPermissions";

describe("ibcEmprestimoAtrasadoPermissions", () => {
  it("libera ADMIN, LOGISTICA, GERENTE_DPTO e VENDAS", () => {
    for (const role of ["ADMIN", "LOGISTICA", "GERENTE_DPTO", "VENDAS"]) {
      assert.equal(ibcEmprestimoAtrasadoPermissions.canView(role), true, role);
    }
  });

  it("nega ALMOX, USER, MOTORISTA e papel ausente", () => {
    for (const role of ["ALMOX", "USER", "MOTORISTA", "", undefined]) {
      assert.equal(ibcEmprestimoAtrasadoPermissions.canView(role), false, String(role));
    }
  });
});
