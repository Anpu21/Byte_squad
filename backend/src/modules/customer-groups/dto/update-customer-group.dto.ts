import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CustomerGroupStatus } from '@common/enums/customer-group-status.enum';

/** Owner edits: rename the group and/or archive it (status → ARCHIVED). */
export class UpdateCustomerGroupDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsEnum(CustomerGroupStatus)
  status?: CustomerGroupStatus;
}
