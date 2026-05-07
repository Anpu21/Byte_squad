import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateCustomerRequestItemDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateCustomerRequestDto {
  @IsUUID()
  branchId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCustomerRequestItemDto)
  items!: CreateCustomerRequestItemDto[];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  guestName?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
