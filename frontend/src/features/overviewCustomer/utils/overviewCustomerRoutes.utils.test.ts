import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCrmCustomerHref, CRM_PORTFOLIO_PATH } from "./overviewCustomerRoutes.utils";

describe("overviewCustomerRoutes.utils", () => {
  it("exposes the CRM portfolio path", () => {
    assert.equal(CRM_PORTFOLIO_PATH, "/crm");
  });

  it("builds the CRM customer href by customer code", () => {
    assert.equal(buildCrmCustomerHref(4821), "/crm/4821");
    assert.equal(buildCrmCustomerHref("10/20"), "/crm/10%2F20");
  });
});
