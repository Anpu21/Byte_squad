import {
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  SUPPLIER_STATUSES,
  type SupplierStatus,
} from '@/modules/suppliers/types/supplier-status.type';

export class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  creditTermDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  openingBalance?: number;

  @IsOptional()
  @IsIn(SUPPLIER_STATUSES)
  status?: SupplierStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
