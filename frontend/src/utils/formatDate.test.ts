import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  estimateNextPurchaseDate,
  formatDaysSinceLastPurchase,
  formatEstimatedDaysUntilNextPurchase,
  formatIsoDateLabel,
} from "./formatDate";

describe("formatDate", () => {
  it("formats days since last purchase with today shortcut", () => {
    assert.equal(formatDaysSinceLastPurchase(0), "Hoje");
    assert.equal(formatDaysSinceLastPurchase(1), "1 dia");
    assert.equal(formatDaysSinceLastPurchase(9), "9 dias");
    assert.equal(formatDaysSinceLastPurchase(null), "Não informado");
  });

  it("estimates next purchase date from last purchase and frequency", () => {
    assert.equal(estimateNextPurchaseDate("2026-08-01", 16), "2026-08-17");
    assert.equal(estimateNextPurchaseDate(null, 16), null);
  });

  it("formats estimated days until next purchase", () => {
    assert.equal(
      formatEstimatedDaysUntilNextPurchase("2026-08-01", 16, new Date("2026-08-10T00:00:00.000Z")),
      "~7 dias",
    );
  });

  it("formats iso dates for pt-BR labels", () => {
    assert.equal(formatIsoDateLabel("2024-01-10"), "10/01/2024");
    assert.equal(formatIsoDateLabel(null), "Não informado");
  });
});
