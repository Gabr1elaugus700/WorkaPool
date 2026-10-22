import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  estimateNextPurchaseDate,
  formatDaysSinceLastPurchase,
  formatEstimatedDaysUntilNextPurchase,
  formatIsoDateLabel,
  formatIsoDateTimeLabel,
  formatIsoDayMonthTimeLabel,
  formatPurchaseFrequencyDays,
  todayLocalIsoDate,
} from "./formatDate";

describe("formatDate", () => {
  it("formats today as a local YYYY-MM-DD date", () => {
    assert.equal(todayLocalIsoDate(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
  });

  it("formats days since last purchase with today shortcut", () => {
    assert.equal(formatDaysSinceLastPurchase(0), "Hoje");
    assert.equal(formatDaysSinceLastPurchase(1), "1 dia");
    assert.equal(formatDaysSinceLastPurchase(9), "9 dias");
    assert.equal(formatDaysSinceLastPurchase(null), "Não informado");
  });

  it("formats purchase frequency as whole days", () => {
    assert.equal(formatPurchaseFrequencyDays(1.29), "1 dia");
    assert.equal(formatPurchaseFrequencyDays(1.5), "2 dias");
    assert.equal(formatPurchaseFrequencyDays(null), "Não informado");
    assert.equal(formatPurchaseFrequencyDays(-1.2), "-1 dias");
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

  it("formats iso timestamps as pt-BR date and time", () => {
    assert.equal(
      formatIsoDateTimeLabel("2026-09-28T13:05:00.000Z", "America/Sao_Paulo"),
      "28/09/2026, 10:05",
    );
    assert.equal(formatIsoDateTimeLabel(null), "Não informado");
    assert.equal(formatIsoDateTimeLabel("not-a-date"), "not-a-date");
  });

  it("formats iso timestamps as day, month and time", () => {
    assert.equal(
      formatIsoDayMonthTimeLabel("2026-10-03T15:00:00.000Z", "America/Sao_Paulo"),
      "03/10 12:00",
    );
    assert.equal(formatIsoDayMonthTimeLabel(null), "Não informado");
  });
});
