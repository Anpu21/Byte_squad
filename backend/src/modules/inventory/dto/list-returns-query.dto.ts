import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ListReturnsQueryDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  /** Filter by the user who processed the return (admin/manager only). */
  @IsOptional()
  @IsUUID()
  cashierId?: string;

  /** Inclusive ISO date (YYYY-MM-DD) lower bound on created_at. */
  @IsOptional()
  @IsDateString()
  startDate?: string;

  /** Inclusive ISO date (YYYY-MM-DD) upper bound on created_at. */
  @IsOptional()
  @IsDateString()
  endDate?: string;

  /** Case-insensitive match on invoice number. */
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
