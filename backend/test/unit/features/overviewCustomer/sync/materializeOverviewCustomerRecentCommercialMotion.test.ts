import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  materializeOverviewCustomerRecentCommercialMotion,
  type OverviewCustomerInvoicedOrderLine,
  type OverviewCustomerRecentCommercialMotionSeed,
} from "../../../../../src/features/overviewCustomer/sync/materializeOverviewCustomerRecentCommercialMotion";

function invoicedLine(
  overrides: Partial<OverviewCustomerInvoicedOrderLine> &
    Pick<OverviewCustomerInvoicedOrderLine, "customerCode" | "orderNumber" | "invoiceDate">,
): OverviewCustomerInvoicedOrderLine {
  return {
    productCode: "P1",
    productName: "Produto 1",
    quantityInvoiced: 10,
    quantityReturned: 0,
    unitPrice: 5,
    lineMarginPercent: 20,
    codRep: 10,
    branchCode: 1,
    ...overrides,
  };
}

describe("materializeOverviewCustomerRecentCommercialMotion", () => {
  it("classifies lost orders strictly from sitped = 5", () => {
    const seed: OverviewCustomerRecentCommercialMotionSeed = {
      invoicedLines: [],
      lostOrders: [
        {
          customerCode: 123,
          orderNumber: 9001,
          issueDate: "2026-08-10",
          sitped: 5,
          codRep: 10,
        },
        {
          customerCode: 123,
          orderNumber: 9002,
          issueDate: "2026-08-11",
          sitped: 1,
          codRep: 10,
        },
      ],
    };

    const snapshot = materializeOverviewCustomerRecentCommercialMotion(seed);
    const customer = snapshot.customers["123"];

    assert.ok(customer);
    assert.deepStrictEqual(
      customer.recentLostOrders.map((row) => row.orderNumber),
      [9001],
    );
    assert.strictEqual(customer.lastLostOrderAt, "2026-08-10");
  });

  it("stores separated movement dates and max movement date", () => {
    const seed: OverviewCustomerRecentCommercialMotionSeed = {
      invoicedLines: [invoicedLine({ customerCode: 123, orderNumber: 9100, invoiceDate: "2026-07-20" })],
      lostOrders: [
        {
          customerCode: 123,
          orderNumber: 9200,
          issueDate: "2026-08-12",
          sitped: 5,
          codRep: 10,
        },
      ],
    };

    const snapshot = materializeOverviewCustomerRecentCommercialMotion(seed);
    const customer = snapshot.customers["123"];

    assert.ok(customer);
    assert.strictEqual(customer.lastInvoicedPurchaseAt, "2026-07-20");
    assert.strictEqual(customer.lastLostOrderAt, "2026-08-12");
    assert.strictEqual(customer.lastCommercialMovementAt, "2026-08-12");
  });

  it("keeps only top 5 most recent rows for invoiced and lost", () => {
    const seed: OverviewCustomerRecentCommercialMotionSeed = {
      invoicedLines: [
        invoicedLine({ customerCode: 123, orderNumber: 1, invoiceDate: "2026-01-01" }),
        invoicedLine({ customerCode: 123, orderNumber: 2, invoiceDate: "2026-01-02" }),
        invoicedLine({ customerCode: 123, orderNumber: 3, invoiceDate: "2026-01-03" }),
        invoicedLine({ customerCode: 123, orderNumber: 4, invoiceDate: "2026-01-04" }),
        invoicedLine({ customerCode: 123, orderNumber: 5, invoiceDate: "2026-01-05" }),
        invoicedLine({ customerCode: 123, orderNumber: 6, invoiceDate: "2026-01-06" }),
      ],
      lostOrders: [
        { customerCode: 123, orderNumber: 11, issueDate: "2026-02-01", sitped: 5 },
        { customerCode: 123, orderNumber: 12, issueDate: "2026-02-02", sitped: 5 },
        { customerCode: 123, orderNumber: 13, issueDate: "2026-02-03", sitped: 5 },
        { customerCode: 123, orderNumber: 14, issueDate: "2026-02-04", sitped: 5 },
        { customerCode: 123, orderNumber: 15, issueDate: "2026-02-05", sitped: 5 },
        { customerCode: 123, orderNumber: 16, issueDate: "2026-02-06", sitped: 5 },
      ],
    };

    const snapshot = materializeOverviewCustomerRecentCommercialMotion(seed);
    const customer = snapshot.customers["123"];

    assert.ok(customer);
    assert.deepStrictEqual(
      customer.recentInvoicedOrders.map((row) => row.orderNumber),
      [6, 5, 4, 3, 2],
    );
    assert.deepStrictEqual(
      customer.recentLostOrders.map((row) => row.orderNumber),
      [16, 15, 14, 13, 12],
    );
  });

  it("aggregates line items with revenue, volume and weighted margin", () => {
    const seed: OverviewCustomerRecentCommercialMotionSeed = {
      invoicedLines: [
        invoicedLine({
          customerCode: 123,
          orderNumber: 500,
          invoiceDate: "2026-08-01",
          productCode: "A",
          productName: "Item A",
          quantityInvoiced: 10,
          unitPrice: 10,
          lineMarginPercent: 20,
        }),
        invoicedLine({
          customerCode: 123,
          orderNumber: 500,
          invoiceDate: "2026-08-01",
          productCode: "B",
          productName: "Item B",
          quantityInvoiced: 5,
          unitPrice: 20,
          lineMarginPercent: 40,
        }),
        invoicedLine({
          customerCode: 123,
          orderNumber: 500,
          invoiceDate: "2026-08-01",
          productCode: "101072",
          productName: "Meio volume",
          quantityInvoiced: 4,
          unitPrice: 10,
          lineMarginPercent: 10,
        }),
      ],
      lostOrders: [],
    };

    const snapshot = materializeOverviewCustomerRecentCommercialMotion(seed);
    const order = snapshot.customers["123"]?.recentInvoicedOrders[0];

    assert.ok(order);
    assert.strictEqual(order.revenue, 240);
    assert.strictEqual(order.volume, 17);
    assert.strictEqual(order.marginPercent, 26.67);
    assert.strictEqual(order.items.length, 3);
    assert.strictEqual(order.items[0]?.productCode, "A");
    assert.strictEqual(order.items[0]?.revenue, 100);
  });

  it("computes 12-month invoiced and lost counts from deduped orders", () => {
    const now = new Date("2026-09-17T12:00:00.000Z");
    const seed: OverviewCustomerRecentCommercialMotionSeed = {
      invoicedLines: [
        invoicedLine({ customerCode: 123, orderNumber: 100, invoiceDate: "2026-08-01" }),
        invoicedLine({ customerCode: 123, orderNumber: 101, invoiceDate: "2026-07-01" }),
        invoicedLine({ customerCode: 123, orderNumber: 102, invoiceDate: "2025-01-01" }),
        invoicedLine({ customerCode: 123, orderNumber: 100, invoiceDate: "2026-08-01", productCode: "P2" }),
      ],
      lostOrders: [
        { customerCode: 123, orderNumber: 200, issueDate: "2026-06-01", sitped: 5 },
        { customerCode: 123, orderNumber: 201, issueDate: "2025-01-01", sitped: 5 },
        { customerCode: 123, orderNumber: 202, issueDate: "2026-05-01", sitped: 1 },
      ],
    };

    const snapshot = materializeOverviewCustomerRecentCommercialMotion(seed, now);
    const customer = snapshot.customers["123"];

    assert.ok(customer);
    assert.strictEqual(customer.invoicedCountLast12Months, 2);
    assert.strictEqual(customer.lostCountLast12Months, 1);
  });

  it("counts invoiced and lost since Jan/2024 and last 60 days at date boundaries", () => {
    const now = new Date("2026-09-21T12:00:00.000Z");
    const seed: OverviewCustomerRecentCommercialMotionSeed = {
      invoicedLines: [
        invoicedLine({ customerCode: 123, orderNumber: 1, invoiceDate: "2024-01-01" }),
        invoicedLine({ customerCode: 123, orderNumber: 2, invoiceDate: "2026-07-23" }),
        invoicedLine({ customerCode: 123, orderNumber: 3, invoiceDate: "2026-07-24" }),
        invoicedLine({ customerCode: 123, orderNumber: 4, invoiceDate: "2026-07-22" }),
        invoicedLine({ customerCode: 123, orderNumber: 3, invoiceDate: "2026-07-24", productCode: "P2" }),
      ],
      lostOrders: [
        { customerCode: 123, orderNumber: 10, issueDate: "2024-06-01", sitped: 5 },
        { customerCode: 123, orderNumber: 11, issueDate: "2026-07-23", sitped: 5 },
        { customerCode: 123, orderNumber: 12, issueDate: "2026-07-24", sitped: 5 },
        { customerCode: 123, orderNumber: 13, issueDate: "2026-07-22", sitped: 5 },
        { customerCode: 123, orderNumber: 14, issueDate: "2026-08-01", sitped: 1 },
      ],
    };

    const snapshot = materializeOverviewCustomerRecentCommercialMotion(seed, now);
    const customer = snapshot.customers["123"];

    assert.ok(customer);
    assert.strictEqual(customer.invoicedCountSinceJan2024, 4);
    assert.strictEqual(customer.lostCountSinceJan2024, 4);
    assert.strictEqual(customer.invoicedCountLast60Days, 2);
    assert.strictEqual(customer.lostCountLast60Days, 2);
    assert.strictEqual(customer.invoicedCountLast12Months, 3);
    assert.strictEqual(customer.lostCountLast12Months, 3);
  });

  it("handles customers with only invoiced or only lost history", () => {
    const seed: OverviewCustomerRecentCommercialMotionSeed = {
      invoicedLines: [
        invoicedLine({
          customerCode: 10,
          orderNumber: 3001,
          invoiceDate: "2026-04-01",
        }),
      ],
      lostOrders: [
        {
          customerCode: 20,
          orderNumber: 4001,
          issueDate: "2026-04-10",
          sitped: 5,
        },
      ],
    };

    const snapshot = materializeOverviewCustomerRecentCommercialMotion(seed);
    const invoicedOnly = snapshot.customers["10"];
    const lostOnly = snapshot.customers["20"];

    assert.ok(invoicedOnly);
    assert.strictEqual(invoicedOnly.lastInvoicedPurchaseAt, "2026-04-01");
    assert.strictEqual(invoicedOnly.lastLostOrderAt, null);
    assert.strictEqual(invoicedOnly.lastCommercialMovementAt, "2026-04-01");
    assert.strictEqual(invoicedOnly.recentLostOrders.length, 0);
    assert.strictEqual(invoicedOnly.recentInvoicedOrders[0]?.items.length, 1);

    assert.ok(lostOnly);
    assert.strictEqual(lostOnly.lastInvoicedPurchaseAt, null);
    assert.strictEqual(lostOnly.lastLostOrderAt, "2026-04-10");
    assert.strictEqual(lostOnly.lastCommercialMovementAt, "2026-04-10");
    assert.strictEqual(lostOnly.recentInvoicedOrders.length, 0);
  });
});
