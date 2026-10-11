import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canViewIbcCadastro, canWriteIbcCadastro } from "./ibcCadastroPermissions";

describe("canViewIbcCadastro", () => {
  it("allows the IBC read roles", () => {
    for (const role of ["ADMIN", "ALMOX", "LOGISTICA", "GERENTE_DPTO"]) {
      assert.equal(canViewIbcCadastro(role), true, role);
    }
  });

  it("denies other roles and a missing role", () => {
    for (const role of ["VENDAS", "USER", "", undefined]) {
      assert.equal(canViewIbcCadastro(role), false, String(role));
    }
  });
});

describe("canWriteIbcCadastro", () => {
  it("allows only ADMIN and ALMOX", () => {
    assert.equal(canWriteIbcCadastro("ADMIN"), true);
    assert.equal(canWriteIbcCadastro("ALMOX"), true);
  });

  it("denies the read-only roles, other roles and a missing role", () => {
    for (const role of ["LOGISTICA", "GERENTE_DPTO", "VENDAS", "USER", "", undefined]) {
      assert.equal(canWriteIbcCadastro(role), false, String(role));
    }
  });
});
