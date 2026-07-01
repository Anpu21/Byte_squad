import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CUSTOMER_STATUSES } from '@/modules/customers/types/customer-status.type';
import { CUSTOMER_TYPES } from '@/modules/customers/types/customer-type.type';
import type { CustomerStatus } from '@/modules/customers/types/customer-status.type';
import type { CustomerType } from '@/modules/customers/types/customer-type.type';

/** Directory filters. Branch is scoped by the service (managers are pinned). */
export class ListCustomersQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn([...CUSTOMER_TYPES, 'all'])
  type?: CustomerType | 'all';

  @IsOptional()
  @IsString()
  @MaxLength(64)
  segment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  tag?: string;

  @IsOptional()
  @IsIn(CUSTOMER_STATUSES)
  status?: CustomerStatus;

  @IsOptional()
  @IsUUID()
  branchId?: string;

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

  @IsOptional()
  @IsIn(['name', 'newest'])
  sort?: 'name' | 'newest';
}
