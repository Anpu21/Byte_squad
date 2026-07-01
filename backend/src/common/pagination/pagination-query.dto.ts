import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MAX_PAGE_SIZE } from './pagination.constants';

/**
 * Base query DTO for paginated list endpoints. Extend it to add filters:
 *
 *   export class ListSuppliersQueryDto extends PaginationQueryDto {
 *     `@IsOptional() `@IsUUID() branchId?: string;
 *   }
 *
 * Both fields are optional; the service resolves the page (1) and limit
 * (DEFAULT_PAGE_SIZE) defaults via `resolvePagination`.
 */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit?: number;
}
