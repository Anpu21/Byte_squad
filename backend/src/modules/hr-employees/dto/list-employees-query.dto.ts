import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

/**
 * Query DTO for `GET /hr/employees`. `branchId` is honoured only for
 * admins — the service overrides it with `actor.branchId` for
 * managers so the URL can never widen scope.
 */
export class ListEmployeesQueryDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['Active', 'Resigned', 'Terminated', 'OnLeave'])
  status?: 'Active' | 'Resigned' | 'Terminated' | 'OnLeave';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
