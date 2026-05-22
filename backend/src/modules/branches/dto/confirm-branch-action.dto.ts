import { IsString, Length, Matches } from 'class-validator';

export class ConfirmBranchActionDto {
  @IsString()
  @Length(6, 6, { message: 'OTP code must be exactly 6 digits.' })
  @Matches(/^\d{6}$/, { message: 'OTP code must be 6 numeric digits.' })
  otpCode!: string;
}
