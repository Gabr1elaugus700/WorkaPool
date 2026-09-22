import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OVERVIEW_CUSTOMER_GROUP_QUOTES_SQL } from "../../../../../src/features/overviewCustomer/sync/overviewCustomerGroupQuotes.sql";

describe("OVERVIEW_CUSTOMER_GROUP_QUOTES_SQL", () => {
  it("keeps group and date params with sitped 9 and 5 and no client or product filter", () => {
    assert.match(OVERVIEW_CUSTOMER_GROUP_QUOTES_SQL, /@grpPro/);
    assert.match(OVERVIEW_CUSTOMER_GROUP_QUOTES_SQL, /@dataInicio/);
    assert.match(OVERVIEW_CUSTOMER_GROUP_QUOTES_SQL, /@dataFimExclusiva/);
    assert.match(OVERVIEW_CUSTOMER_GROUP_QUOTES_SQL, /ped\.sitped IN \(9, 5\)/);
    assert.match(OVERVIEW_CUSTOMER_GROUP_QUOTES_SQL, /grp\.codgrp = @grpPro/);
    assert.match(
      OVERVIEW_CUSTOMER_GROUP_QUOTES_SQL,
      /ped\.datemi >= @dataInicio/,
    );
    assert.match(
      OVERVIEW_CUSTOMER_GROUP_QUOTES_SQL,
      /ped\.datemi < @dataFimExclusiva/,
    );
    assert.match(OVERVIEW_CUSTOMER_GROUP_QUOTES_SQL, /FROM e120ped ped/);
    assert.match(OVERVIEW_CUSTOMER_GROUP_QUOTES_SQL, /INNER JOIN e120ipd ipd/);
    assert.match(OVERVIEW_CUSTOMER_GROUP_QUOTES_SQL, /INNER JOIN e090rep rep/);
    assert.match(OVERVIEW_CUSTOMER_GROUP_QUOTES_SQL, /INNER JOIN e085cli cli/);
    assert.match(
      OVERVIEW_CUSTOMER_GROUP_QUOTES_SQL,
      /LEFT JOIN poolbi\.dbo\.grppro grp/,
    );
    assert.equal(OVERVIEW_CUSTOMER_GROUP_QUOTES_SQL.includes("GETDATE"), false);
    assert.equal(OVERVIEW_CUSTOMER_GROUP_QUOTES_SQL.includes("DATEADD"), false);
    assert.equal(OVERVIEW_CUSTOMER_GROUP_QUOTES_SQL.includes("@codCli"), false);
    assert.doesNotMatch(OVERVIEW_CUSTOMER_GROUP_QUOTES_SQL, /AND\s+ipd\.codpro/);
  });
});
