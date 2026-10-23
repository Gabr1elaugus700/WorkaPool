import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isIbcCompativelComGrupos } from "../../../../../src/features/ibc/services/isIbcCompativelComGrupos";

describe("isIbcCompativelComGrupos", () => {
  it("aceita universal mesmo sem grupo permitido", () => {
    assert.equal(
      isIbcCompativelComGrupos(
        { identificador: "NH00001", universal: true, grupoCodigo: null },
        [],
      ),
      true,
    );
  });

  it("aceita HM e NH quando o grupo está no conjunto", () => {
    assert.equal(
      isIbcCompativelComGrupos(
        { identificador: "HMS00001", universal: false, grupoCodigo: "SODA" },
        ["SODA"],
      ),
      true,
    );
    assert.equal(
      isIbcCompativelComGrupos(
        { identificador: "NHS00001", universal: false, grupoCodigo: "SODA" },
        ["ACIDO", "SODA"],
      ),
      true,
    );
  });

  it("recusa grupo fora do conjunto", () => {
    assert.equal(
      isIbcCompativelComGrupos(
        { identificador: "NHC00001", universal: false, grupoCodigo: "CLORO" },
        ["SODA"],
      ),
      false,
    );
  });

  it("recusa legado HM#### mesmo com grupo ou marcado universal", () => {
    assert.equal(
      isIbcCompativelComGrupos(
        { identificador: "HM0007", universal: false, grupoCodigo: "SODA" },
        ["SODA"],
      ),
      false,
    );
    assert.equal(
      isIbcCompativelComGrupos(
        { identificador: "hm0045", universal: true, grupoCodigo: null },
        ["SODA"],
      ),
      false,
    );
  });

  it("recusa container sem grupo que não é universal", () => {
    assert.equal(
      isIbcCompativelComGrupos(
        { identificador: "NHM00001", universal: false, grupoCodigo: null },
        ["SODA"],
      ),
      false,
    );
  });
});
