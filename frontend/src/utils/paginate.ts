export type PaginatedSlice<T> = {
  pageItems: T[];
  page: number;
  totalPages: number;
};

export function paginate<T>(items: readonly T[], page: number, pageSize: number): PaginatedSlice<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return { pageItems: items.slice(start, start + pageSize), page: safePage, totalPages };
}
