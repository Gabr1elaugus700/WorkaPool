import type { OverviewCustomerObservationCursor } from "../types/overviewCustomerObservation.types";

export function buildOverviewCustomerObservationsPath(
  customerCode: number | string,
  before?: OverviewCustomerObservationCursor,
): string {
  const base = `/api/overview/customers/${encodeURIComponent(String(customerCode))}/observations`;
  if (!before) {
    return base;
  }

  const params = new URLSearchParams();
  params.set("beforeCreatedAt", before.createdAt);
  params.set("beforeId", before.id);
  return `${base}?${params.toString()}`;
}
