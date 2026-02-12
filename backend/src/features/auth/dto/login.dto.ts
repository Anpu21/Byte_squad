import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/** DTO for user login requests. */
export class LoginDto {
    @IsString()
    @IsNotEmpty()
    username!: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(4)
    password!: string;
}
