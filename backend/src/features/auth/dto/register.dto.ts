import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Role } from '../../../shared/enums/role.enum.js';

/** DTO for user registration requests. */
export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role!: Role;
}
