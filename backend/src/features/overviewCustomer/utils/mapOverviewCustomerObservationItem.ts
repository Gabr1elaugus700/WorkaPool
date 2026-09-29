import type { OverviewCustomerObservationRecord } from "../repositories/OverviewCustomerObservationRepository";
import type { OverviewCustomerObservationListItem } from "../useCases/ListOverviewCustomerObservationsUseCase";

export function mapOverviewCustomerObservationItem(
  record: OverviewCustomerObservationRecord,
  authorDisplayName: string,
): OverviewCustomerObservationListItem {
  return {
    id: record.id,
    customerCode: record.customerCode,
    authorUserId: record.authorUserId,
    authorDisplayName,
    body: record.body,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    editedAt: record.editedAt ? record.editedAt.toISOString() : null,
  };
}
