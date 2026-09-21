import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isOverviewCustomerForbiddenMessage } from "./overviewCustomerForbidden.utils";

describe("overviewCustomerForbidden.utils", () => {
  it("detects forbidden API messages", () => {
    assert.equal(isOverviewCustomerForbiddenMessage("Acesso negado"), true);
    assert.equal(isOverviewCustomerForbiddenMessage("Não foi possível carregar"), false);
  });
});
