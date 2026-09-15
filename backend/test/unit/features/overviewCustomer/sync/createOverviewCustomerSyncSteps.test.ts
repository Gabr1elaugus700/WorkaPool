import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createOverviewCustomerSyncSteps } from "../../../../../src/features/overviewCustomer/sync/createOverviewCustomerSyncSteps";
import type { OverviewCustomerIdentitySeed } from "../../../../../src/features/overviewCustomer/sync/materializeOverviewCustomerIdentity";

describe("createOverviewCustomerSyncSteps", () => {
  it("builds identity snapshot on first step and keeps remaining steps as pending wiring", async () => {
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

    const steps = createOverviewCustomerSyncSteps({
      fetchSeed: async () => seed,
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

    const pendingResult = await steps[2].execute();
    assert.ok(typeof pendingResult === "object" && pendingResult !== null);
    const pendingRecord = pendingResult as { status: string };
    assert.strictEqual(pendingRecord.status, "PENDING_WIRING");
  });
});
