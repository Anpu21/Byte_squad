import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class ListAuditLogsQueryDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsIn(['POST', 'PATCH', 'PUT', 'DELETE'])
  method?: string;

  /** Substring match on the request path. */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  /** ISO date `YYYY-MM-DD`, inclusive. */
  @IsOptional()
  @IsDateString()
  startDate?: string;

  /** ISO date `YYYY-MM-DD`, inclusive. */
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
