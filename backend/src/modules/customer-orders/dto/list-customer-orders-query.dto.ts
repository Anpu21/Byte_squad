import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { CustomerOrderStatus } from '@common/enums/customer-order.enum';

export class ListCustomerOrdersQueryDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsEnum(CustomerOrderStatus)
  status?: CustomerOrderStatus;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
