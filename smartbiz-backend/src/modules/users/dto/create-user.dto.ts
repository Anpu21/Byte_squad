import {
    IsString,
    IsEmail,
    IsOptional,
    IsBoolean,
    IsUUID,
    MinLength,
    MaxLength,
} from 'class-validator';

export class CreateUserDto {
    @IsString()
    @MinLength(3)
    @MaxLength(50)
    username: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    @MinLength(1)
    @MaxLength(100)
    firstName: string;

    @IsString()
    @MinLength(1)
    @MaxLength(100)
    lastName: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsUUID()
    roleId: string;

    @IsUUID()
    companyId: string;

    @IsOptional()
    @IsUUID()
    branchId?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
