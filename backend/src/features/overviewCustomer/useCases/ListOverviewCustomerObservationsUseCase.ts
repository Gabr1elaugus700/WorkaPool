import type { OverviewCustomerObservationAuthorLookup } from "../repositories/OverviewCustomerObservationAuthorRepository";
import type {
  OverviewCustomerObservationBeforeCursor,
  OverviewCustomerObservationRepository,
} from "../repositories/OverviewCustomerObservationRepository";
import type { OverviewCustomerSyncStore } from "../sync/ports";
import {
  assertOverviewCustomerAccess,
  type AssertOverviewCustomerAccessInput,
} from "../utils/assertOverviewCustomerAccess";

const PAGE_SIZE = 50;

export type ListOverviewCustomerObservationsInput =
  AssertOverviewCustomerAccessInput & {
    before?: {
      createdAt: string | Date;
      id: string;
    };
  };

export type OverviewCustomerObservationListItem = {
  id: string;
  customerCode: number;
  authorUserId: string;
  authorDisplayName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
};

export type ListOverviewCustomerObservationsResult = {
  items: OverviewCustomerObservationListItem[];
  hasOlder: boolean;
  nextBefore: { createdAt: string; id: string } | null;
};

export class ListOverviewCustomerObservationsUseCase {
  constructor(
    private readonly store: OverviewCustomerSyncStore,
    private readonly observations: OverviewCustomerObservationRepository,
    private readonly authors: OverviewCustomerObservationAuthorLookup,
  ) {}

  async execute(
    input: ListOverviewCustomerObservationsInput,
  ): Promise<ListOverviewCustomerObservationsResult> {
    await assertOverviewCustomerAccess(this.store, {
      customerCode: input.customerCode,
      role: input.role,
      codRep: input.codRep,
    });

    const before = toBeforeCursor(input.before);
    const page = await this.observations.findRecentPage(
      input.customerCode,
      PAGE_SIZE + 1,
      before,
    );

    const hasOlder = page.length > PAGE_SIZE;
    const records = hasOlder ? page.slice(1) : page;

    const authorIds = [...new Set(records.map((row) => row.authorUserId))];
    const authorMatches = await this.authors.findDisplayNamesByIds(authorIds);
    const displayNameById = new Map(
      authorMatches.map((match) => [match.id, match.displayName]),
    );

    const items: OverviewCustomerObservationListItem[] = records.map((row) => ({
      id: row.id,
      customerCode: row.customerCode,
      authorUserId: row.authorUserId,
      authorDisplayName: displayNameById.get(row.authorUserId) ?? "",
      body: row.body,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      editedAt: row.editedAt ? row.editedAt.toISOString() : null,
    }));

    const oldest = items[0];
    const nextBefore =
      hasOlder && oldest
        ? { createdAt: oldest.createdAt, id: oldest.id }
        : null;

    return { items, hasOlder, nextBefore };
  }
}

function toBeforeCursor(
  before: ListOverviewCustomerObservationsInput["before"],
): OverviewCustomerObservationBeforeCursor | undefined {
  if (!before) {
    return undefined;
  }

  return {
    createdAt:
      before.createdAt instanceof Date
        ? before.createdAt
        : new Date(before.createdAt),
    id: before.id,
  };
}
