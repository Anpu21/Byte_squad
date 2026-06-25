import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query params for `GET /pos/customers/search`. `q` is the prefix term the
 * cashier typed (matched against customer name/email/phone). `limit` caps the
 * result set at 50 so the customer picker never has to virtualize.
 *
 * Mirrors `SearchProductsQueryDto` so the controller-level validation is
 * consistent across all POS search endpoints; raw `Number(...)` coercion in
 * the controller previously let `limit=abc` flow through as `NaN`.
 */
export class SearchCustomersQueryDto {
  @IsString()
  q!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
