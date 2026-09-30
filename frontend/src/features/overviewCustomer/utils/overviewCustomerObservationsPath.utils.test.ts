import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildOverviewCustomerObservationPath,
  buildOverviewCustomerObservationsPath,
} from "./overviewCustomerObservationsPath.utils";

describe("buildOverviewCustomerObservationsPath", () => {
  it("builds the observations path without a cursor", () => {
    assert.equal(
      buildOverviewCustomerObservationsPath(123),
      "/api/overview/customers/123/observations",
    );
  });

  it("appends beforeCreatedAt and beforeId with the ISO date encoded", () => {
    assert.equal(
      buildOverviewCustomerObservationsPath(123, {
        createdAt: "2026-09-27T17:19:00.000Z",
        id: "obs-1",
      }),
      "/api/overview/customers/123/observations?beforeCreatedAt=2026-09-27T17%3A19%3A00.000Z&beforeId=obs-1",
    );
  });

  it("encodes reserved characters in the customer code", () => {
    assert.equal(
      buildOverviewCustomerObservationsPath("10/20"),
      "/api/overview/customers/10%2F20/observations",
    );
  });
});

describe("buildOverviewCustomerObservationPath", () => {
  it("appends the encoded observation id", () => {
    assert.equal(
      buildOverviewCustomerObservationPath(123, "obs/1"),
      "/api/overview/customers/123/observations/obs%2F1",
    );
  });
});
