/**
 * Pagination Utilities
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  totalCount: number,
  page: number = 1,
  limit: number = 20,
): PaginationMeta {
  const totalPages = Math.ceil(totalCount / limit);
  
  return {
    page,
    limit,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Calculate skip value for database queries
 */
export function calculateSkip(page: number = 1, limit: number = 20): number {
  return (page - 1) * limit;
}

/**
 * Validate and sanitize pagination parameters
 */
export function sanitizePaginationParams(
  params: PaginationParams,
  maxLimit: number = 100,
): { page: number; limit: number } {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(maxLimit, Math.max(1, params.limit || 20));
  
  return { page, limit };
}


