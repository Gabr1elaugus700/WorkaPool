import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createOverviewCustomerSyncSteps } from "../../../../../src/features/overviewCustomer/sync/createOverviewCustomerSyncSteps";
import type { OverviewCustomerIdentitySeed } from "../../../../../src/features/overviewCustomer/sync/materializeOverviewCustomerIdentity";
import type { OverviewCustomerCommercialSummarySeed } from "../../../../../src/features/overviewCustomer/sync/materializeOverviewCustomerCommercialSummary";

describe("createOverviewCustomerSyncSteps", () => {
  it("builds identity and commercial-summary snapshots before pending steps", async () => {
    const seed: OverviewCustomerIdentitySeed = {
      customers: [
        {
          customerCode: 123,
          tradeName: "Cliente A",
          document: "00.000.000/0001-00",
          city: "Maringa",
          state: "PR",
          segment: "Construcao",
          registrationDate: "2024-01-15",
        },
      ],
      sales: [
        {
          customerCode: 123,
          codRep: 10,
          invoiceDate: "2026-08-01",
          branchCode: 1,
          isInvoiced: true,
        },
      ],
    };
    const summarySeed: OverviewCustomerCommercialSummarySeed = {
      lines: [
        {
          customerCode: 123,
          orderId: 9001,
          issuedAt: "2026-08-01",
          productCode: "101072",
          quantityInvoiced: 4,
          quantityReturned: 0,
          unitPrice: 20,
          lineMarginPercent: 30,
        },
      ],
    };

    const steps = createOverviewCustomerSyncSteps({
      fetchSeed: async () => seed,
    }, {
      fetchSeed: async () => summarySeed,
    });

    assert.strictEqual(steps.length, 5);
    assert.strictEqual(steps[0].name, "dados-gerais-cliente");
    assert.strictEqual(steps[1].name, "resumo-comercial");

    const firstResult = await steps[0].execute();
    assert.ok(typeof firstResult === "object" && firstResult !== null);
    const firstRecord = firstResult as {
      customers: Record<string, { customerCode: number; primaryCodRep: number | null }>;
      metadata: { customerCount: number };
    };
    assert.strictEqual(firstRecord.metadata.customerCount, 1);
    assert.strictEqual(firstRecord.customers["123"].customerCode, 123);
    assert.strictEqual(firstRecord.customers["123"].primaryCodRep, 10);

    const secondResult = await steps[1].execute();
    assert.ok(typeof secondResult === "object" && secondResult !== null);
    const secondRecord = secondResult as {
      customers: Record<string, { orderCountLast12Months: number }>;
      metadata: { customerCount: number };
    };
    assert.strictEqual(secondRecord.metadata.customerCount, 1);
    assert.strictEqual(secondRecord.customers["123"].orderCountLast12Months, 1);

    const pendingResult = await steps[2].execute();
    assert.ok(typeof pendingResult === "object" && pendingResult !== null);
    const pendingRecord = pendingResult as { status: string };
    assert.strictEqual(pendingRecord.status, "PENDING_WIRING");
  });
});
