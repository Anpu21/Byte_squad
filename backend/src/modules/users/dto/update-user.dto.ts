import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { UserRole } from '@common/enums/user-roles.enums';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsUUID()
  @IsOptional()
  branchId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string | null;
}
