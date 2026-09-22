import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  materializeOverviewCustomerRecentCommercialMotion,
  type OverviewCustomerRecentCommercialMotionSeed,
} from "../../../../../src/features/overviewCustomer/sync/materializeOverviewCustomerRecentCommercialMotion";

describe("materializeOverviewCustomerRecentCommercialMotion", () => {
  it("classifies lost orders strictly from sitped = 5", () => {
    const seed: OverviewCustomerRecentCommercialMotionSeed = {
      invoicedOrders: [],
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
      invoicedOrders: [
        {
          customerCode: 123,
          orderNumber: 9100,
          invoiceDate: "2026-07-20",
          codRep: 10,
          branchCode: 1,
        },
      ],
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
      invoicedOrders: [
        { customerCode: 123, orderNumber: 1, invoiceDate: "2026-01-01" },
        { customerCode: 123, orderNumber: 2, invoiceDate: "2026-01-02" },
        { customerCode: 123, orderNumber: 3, invoiceDate: "2026-01-03" },
        { customerCode: 123, orderNumber: 4, invoiceDate: "2026-01-04" },
        { customerCode: 123, orderNumber: 5, invoiceDate: "2026-01-05" },
        { customerCode: 123, orderNumber: 6, invoiceDate: "2026-01-06" },
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

  it("computes 12-month invoiced and lost counts from deduped orders", () => {
    const now = new Date("2026-09-17T12:00:00.000Z");
    const seed: OverviewCustomerRecentCommercialMotionSeed = {
      invoicedOrders: [
        { customerCode: 123, orderNumber: 100, invoiceDate: "2026-08-01" },
        { customerCode: 123, orderNumber: 101, invoiceDate: "2026-07-01" },
        { customerCode: 123, orderNumber: 102, invoiceDate: "2025-01-01" },
        { customerCode: 123, orderNumber: 100, invoiceDate: "2026-08-01" },
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

  it("handles customers with only invoiced or only lost history", () => {
    const seed: OverviewCustomerRecentCommercialMotionSeed = {
      invoicedOrders: [
        {
          customerCode: 10,
          orderNumber: 3001,
          invoiceDate: "2026-04-01",
        },
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

    assert.ok(lostOnly);
    assert.strictEqual(lostOnly.lastInvoicedPurchaseAt, null);
    assert.strictEqual(lostOnly.lastLostOrderAt, "2026-04-10");
    assert.strictEqual(lostOnly.lastCommercialMovementAt, "2026-04-10");
    assert.strictEqual(lostOnly.recentInvoicedOrders.length, 0);
  });
});
