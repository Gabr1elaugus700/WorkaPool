export type PaginationParams = {
    page?: number;
    pageSize?: number;
  };
  
  export function paginateArray<T>(items: T[], params?: PaginationParams) {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
  
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
  
    return {
      data: items.slice(startIndex, endIndex),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }