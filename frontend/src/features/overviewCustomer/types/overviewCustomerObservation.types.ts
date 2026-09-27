export type OverviewCustomerObservation = {
  id: string;
  customerCode: number;
  authorUserId: string;
  /** Empty string when the author has no resolvable display name. */
  authorDisplayName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
};

export type OverviewCustomerObservationCursor = {
  createdAt: string;
  id: string;
};

export type OverviewCustomerObservationListResponse = {
  items: OverviewCustomerObservation[];
  hasOlder: boolean;
  nextBefore: OverviewCustomerObservationCursor | null;
};

export type OverviewCustomerObservationCreateInput = {
  body: string;
};
