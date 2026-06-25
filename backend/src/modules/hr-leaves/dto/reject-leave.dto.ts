import { IsString, MaxLength, MinLength } from 'class-validator';

export class RejectLeaveDto {
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  rejectionReason!: string;
}
