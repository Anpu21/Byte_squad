import { IsEmail } from 'class-validator';

export class CustomerResendOtpDto {
  @IsEmail()
  email!: string;
}
