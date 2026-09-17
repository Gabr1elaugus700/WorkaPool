import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createOverviewCustomerSyncSteps } from "../../../../../src/features/overviewCustomer/sync/createOverviewCustomerSyncSteps";
import type { OverviewCustomerIdentitySeed } from "../../../../../src/features/overviewCustomer/sync/materializeOverviewCustomerIdentity";
import type { OverviewCustomerCommercialSummarySeed } from "../../../../../src/features/overviewCustomer/sync/materializeOverviewCustomerCommercialSummary";
import type { OverviewCustomerMonthlyEvolutionSeed } from "../../../../../src/features/overviewCustomer/sync/materializeOverviewCustomerMonthlyEvolution";
import type { OverviewCustomerPurchasedProductsSeed } from "../../../../../src/features/overviewCustomer/sync/materializeOverviewCustomerPurchasedProducts";
import type { OverviewCustomerRecentCommercialMotionSeed } from "../../../../../src/features/overviewCustomer/sync/materializeOverviewCustomerRecentCommercialMotion";

describe("createOverviewCustomerSyncSteps", () => {
  it("builds identity, summary and recent motion snapshots", async () => {
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
    const purchasedSeed: OverviewCustomerPurchasedProductsSeed = {
      lines: [
        {
          customerCode: 123,
          orderId: 9001,
          issuedAt: "2026-08-01",
          productCode: "101072",
          productName: "Produto A",
          quantityInvoiced: 4,
          quantityReturned: 0,
          unitPrice: 20,
          lineMarginPercent: 30,
        },
      ],
    };
    const recentMotionSeed: OverviewCustomerRecentCommercialMotionSeed = {
      invoicedOrders: [
        {
          customerCode: 123,
          orderNumber: 9001,
          invoiceDate: "2026-08-01",
          codRep: 10,
          branchCode: 1,
        },
      ],
      lostOrders: [
        {
          customerCode: 123,
          orderNumber: 9002,
          issueDate: "2026-08-03",
          sitped: 5,
          codRep: 10,
        },
      ],
    };

    const steps = createOverviewCustomerSyncSteps(
      {
        fetchSeed: async () => seed,
      },
      {
        fetchSeed: async () => summarySeed,
      },
      {
        fetchSeed: async () => ({ rows: [] }),
      },
      {
        fetchSeed: async () => purchasedSeed,
      },
      {
        fetchSeed: async () => recentMotionSeed,
      },
    );

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

    const monthlyResult = await steps[2].execute();
    assert.ok(typeof monthlyResult === "object" && monthlyResult !== null);
    const monthlyRecord = monthlyResult as { customers: Record<string, unknown> };
    assert.deepStrictEqual(monthlyRecord.customers, {});

    const purchasedProductsResult = await steps[3].execute();
    assert.ok(typeof purchasedProductsResult === "object" && purchasedProductsResult !== null);
    const purchasedProductsRecord = purchasedProductsResult as {
      customers: Record<string, Array<{ productCode: string }>>;
      metadata: { customerCount: number };
    };
    assert.strictEqual(purchasedProductsRecord.metadata.customerCount, 1);
    assert.strictEqual(
      purchasedProductsRecord.customers["123"][0].productCode,
      "101072",
    );

    const recentMotionResult = await steps[4].execute();
    assert.ok(typeof recentMotionResult === "object" && recentMotionResult !== null);
    const recentMotionRecord = recentMotionResult as {
      customers: Record<
        string,
        {
          lastCommercialMovementAt: string | null;
          recentLostOrders: Array<{ orderNumber: number }>;
        }
      >;
      metadata: { customerCount: number };
    };
    assert.strictEqual(recentMotionRecord.metadata.customerCount, 1);
    assert.strictEqual(
      recentMotionRecord.customers["123"].lastCommercialMovementAt,
      "2026-08-03",
    );
    assert.deepStrictEqual(
      recentMotionRecord.customers["123"].recentLostOrders.map((row) => row.orderNumber),
      [9002],
    );
  });

  it("wires monthly evolution sync step with customer snapshot output", async () => {
    const identitySeed: OverviewCustomerIdentitySeed = {
      customers: [],
      sales: [],
    };
    const summarySeed: OverviewCustomerCommercialSummarySeed = { lines: [] };
    const monthlySeed: OverviewCustomerMonthlyEvolutionSeed = {
      rows: [
        {
          customerCode: 123,
          month: "2024-01",
          revenue: 500,
          volume: 20,
          orderCount: 3,
          marginPercent: 15,
        },
      ],
    };

    const steps = createOverviewCustomerSyncSteps(
      { fetchSeed: async () => identitySeed },
      { fetchSeed: async () => summarySeed },
      { fetchSeed: async () => monthlySeed },
      { fetchSeed: async () => ({ lines: [] }) },
      { fetchSeed: async () => ({ invoicedOrders: [], lostOrders: [] }) },
    );

    const monthlyResult = await steps[2].execute();
    assert.ok(typeof monthlyResult === "object" && monthlyResult !== null);
    const monthlyRecord = monthlyResult as {
      customers: Record<string, Array<{ month: string }>>;
      metadata: { customerCount: number };
    };
    assert.strictEqual(monthlyRecord.metadata.customerCount, 1);
    assert.deepStrictEqual(monthlyRecord.customers["123"], [
      {
        month: "2024-01",
        revenue: 500,
        volume: 20,
        orderCount: 3,
        marginPercent: 15,
      },
    ]);
  });
});
