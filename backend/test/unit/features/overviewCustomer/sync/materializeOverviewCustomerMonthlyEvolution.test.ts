import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  materializeOverviewCustomerMonthlyEvolution,
  type OverviewCustomerMonthlyEvolutionSeed,
} from "../../../../../src/features/overviewCustomer/sync/materializeOverviewCustomerMonthlyEvolution";

describe("materializeOverviewCustomerMonthlyEvolution", () => {
  it("materializes only months since Jan/2024 in chronological order", () => {
    const seed: OverviewCustomerMonthlyEvolutionSeed = {
      rows: [
        {
          customerCode: 123,
          month: "2024-03",
          revenue: 400,
          volume: 20,
          orderCount: 4,
          marginPercent: 18.5,
        },
        {
          customerCode: 123,
          month: "2023-12",
          revenue: 999,
          volume: 50,
          orderCount: 9,
          marginPercent: 12,
        },
        {
          customerCode: 123,
          month: "2024-01",
          revenue: 200,
          volume: 10,
          orderCount: 2,
          marginPercent: null,
        },
      ],
    };

    const snapshot = materializeOverviewCustomerMonthlyEvolution(seed);

    assert.deepStrictEqual(snapshot.customers["123"], [
      {
        month: "2024-01",
        revenue: 200,
        volume: 10,
        orderCount: 2,
        marginPercent: null,
      },
      {
        month: "2024-03",
        revenue: 400,
        volume: 20,
        orderCount: 4,
        marginPercent: 18.5,
      },
    ]);
  });

  it("keeps revenue/volume/orderCount when margin is missing", () => {
    const seed: OverviewCustomerMonthlyEvolutionSeed = {
      rows: [
        {
          customerCode: 90,
          month: "2024-08",
          revenue: 1000,
          volume: 80,
          orderCount: 5,
          marginPercent: null,
        },
      ],
    };

    const snapshot = materializeOverviewCustomerMonthlyEvolution(seed);

    assert.deepStrictEqual(snapshot.customers["90"], [
      {
        month: "2024-08",
        revenue: 1000,
        volume: 80,
        orderCount: 5,
        marginPercent: null,
      },
    ]);
  });
});
