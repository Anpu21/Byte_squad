import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CustomerVerifyOtpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  otpCode!: string;
}
