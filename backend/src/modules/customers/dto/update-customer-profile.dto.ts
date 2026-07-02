import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CUSTOMER_STATUSES } from '@/modules/customers/types/customer-status.type';
import type { CustomerStatus } from '@/modules/customers/types/customer-status.type';

/**
 * Partial update of a customer's management metadata (the `customer_profiles`
 * side-table). Any omitted field is left unchanged; empty `notes`/`segment`
 * strings clear the value.
 */
export class UpdateCustomerProfileDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  segment?: string;

  @IsOptional()
  @IsIn(CUSTOMER_STATUSES)
  status?: CustomerStatus;
}
