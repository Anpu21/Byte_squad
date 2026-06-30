import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './pagination.constants';
import type { IPaginated } from './paginated.type';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ResolvedPagination {
  page: number;
  limit: number;
  /** Rows to skip — `(page - 1) * limit`. */
  skip: number;
}

/**
 * Normalize raw query params into a safe 1-based page and a bounded limit
 * (defaulting to DEFAULT_PAGE_SIZE, capped at MAX_PAGE_SIZE). Use this when you
 * need the resolved numbers before building a query.
 */
export function resolvePagination(params: PaginationParams): ResolvedPagination {
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const limit = Math.min(
    Math.max(1, Math.floor(params.limit ?? DEFAULT_PAGE_SIZE)),
    MAX_PAGE_SIZE,
  );
  return { page, limit, skip: (page - 1) * limit };
}

/**
 * Wrap an already-sliced set of rows and its total count in the standard
 * `IPaginated` envelope. Use for hand-assembled lists (raw SQL, mapped DTOs)
 * where `paginate()` can't run the query for you.
 */
export function toPaginated<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): IPaginated<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/**
 * Apply `.skip/.take` to a TypeORM query builder and return the paginated
 * envelope — the one-liner for straight entity list queries:
 *
 *   return paginate(qb.where(...).orderBy(...), { page, limit });
 *
 * For raw/mapped rows, call `resolvePagination` + `toPaginated` instead.
 */
export async function paginate<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  params: PaginationParams,
): Promise<IPaginated<T>> {
  const { page, limit, skip } = resolvePagination(params);
  const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();
  return toPaginated(items, total, page, limit);
}
