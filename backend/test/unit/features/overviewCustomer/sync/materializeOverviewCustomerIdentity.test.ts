import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  materializeOverviewCustomerIdentity,
  type OverviewCustomerIdentitySeed,
} from "../../../../../src/features/overviewCustomer/sync/materializeOverviewCustomerIdentity";

describe("materializeOverviewCustomerIdentity", () => {
  it("materializes required fields and branch indicator BOTH", () => {
    const seed: OverviewCustomerIdentitySeed = {
      customers: [
        {
          customerCode: 123,
          tradeName: "Cliente A",
          document: "00.000.000/0001-00",
          city: "Maringa",
          state: "PR",
          segment: "Construcao",
          registrationDate: "2020-03-01",
        },
      ],
      sales: [
        {
          customerCode: 123,
          codRep: 10,
          invoiceDate: "2026-01-01",
          branchCode: 1,
          isInvoiced: true,
        },
        {
          customerCode: 123,
          codRep: 10,
          invoiceDate: "2026-02-01",
          branchCode: 2,
          isInvoiced: true,
        },
      ],
    };

    const snapshot = materializeOverviewCustomerIdentity(seed);
    const customer = snapshot.customers["123"];

    assert.ok(customer);
    assert.strictEqual(customer.primaryCodRep, 10);
    assert.strictEqual(customer.branchIndicator, "BOTH");
    assert.strictEqual(customer.firstInvoicedPurchaseAt, "2026-01-01");
    assert.strictEqual(customer.lastInvoicedPurchaseAt, "2026-02-01");
  });

  it("ignores non-invoiced rows when computing first/last purchase and primary seller", () => {
    const seed: OverviewCustomerIdentitySeed = {
      customers: [
        {
          customerCode: 123,
          tradeName: "Cliente A",
          document: "00.000.000/0001-00",
          city: "Maringa",
          state: "PR",
          segment: "Construcao",
          registrationDate: "2020-03-01",
        },
      ],
      sales: [
        {
          customerCode: 123,
          codRep: 30,
          invoiceDate: "2025-01-01",
          branchCode: 2,
          isInvoiced: false,
        },
        {
          customerCode: 123,
          codRep: 10,
          invoiceDate: "2026-03-01",
          branchCode: 1,
          isInvoiced: true,
        },
        {
          customerCode: 123,
          codRep: 10,
          invoiceDate: "2026-04-01",
          branchCode: 1,
          isInvoiced: true,
        },
      ],
    };

    const snapshot = materializeOverviewCustomerIdentity(seed);
    const customer = snapshot.customers["123"];

    assert.ok(customer);
    assert.strictEqual(customer.primaryCodRep, 10);
    assert.strictEqual(customer.firstInvoicedPurchaseAt, "2026-03-01");
    assert.strictEqual(customer.lastInvoicedPurchaseAt, "2026-04-01");
    assert.strictEqual(customer.branchIndicator, "MGA");
  });
});
