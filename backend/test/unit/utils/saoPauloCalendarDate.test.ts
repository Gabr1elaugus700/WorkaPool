import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addCalendarDays,
  formatSaoPauloCalendarDate,
} from "../../../src/utils/saoPauloCalendarDate";

describe("saoPauloCalendarDate", () => {
  it("formats a reference instant in America/Sao_Paulo as YYYY-MM-DD", () => {
    const reference = new Date("2026-09-21T12:00:00.000Z");
    assert.equal(formatSaoPauloCalendarDate(reference), "2026-09-21");
  });

  it("adds calendar days across month boundaries", () => {
    assert.equal(addCalendarDays("2026-03-05", -12), "2026-02-21");
    assert.equal(addCalendarDays("2026-09-21", 1), "2026-09-22");
  });
});
