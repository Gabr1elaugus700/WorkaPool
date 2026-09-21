import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OVERVIEW_CUSTOMER_GROUP_PERDIDOS_SQL } from "../../../../../src/features/overviewCustomer/sync/overviewCustomerGroupPerdidos.sql";

describe("OVERVIEW_CUSTOMER_GROUP_PERDIDOS_SQL", () => {
  it("keeps sitped 5 and group params without date window or product filter", () => {
    assert.match(OVERVIEW_CUSTOMER_GROUP_PERDIDOS_SQL, /ped\.sitped = '5'/);
    assert.match(OVERVIEW_CUSTOMER_GROUP_PERDIDOS_SQL, /@codCli/);
    assert.match(OVERVIEW_CUSTOMER_GROUP_PERDIDOS_SQL, /@codGrp/);
    assert.equal(OVERVIEW_CUSTOMER_GROUP_PERDIDOS_SQL.includes("BETWEEN"), false);
    assert.doesNotMatch(OVERVIEW_CUSTOMER_GROUP_PERDIDOS_SQL, /AND\s+ipd\.codpro/);
  });
});
