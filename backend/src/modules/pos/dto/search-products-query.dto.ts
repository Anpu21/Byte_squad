import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query params for `GET /pos/products/search`. `q` is the prefix term the
 * cashier typed (matched against product name OR barcode). `limit` caps the
 * result set at 50 so the UI never has to virtualize a typeahead.
 */
export class SearchProductsQueryDto {
  @IsString()
  q!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
