import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { UserRole } from '../../../../../shared/constants/enums.js';

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
    branchId?: string;

    @IsString()
    @IsOptional()
    avatarUrl?: string;
}
