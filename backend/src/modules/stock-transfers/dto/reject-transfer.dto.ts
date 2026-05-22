import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectTransferDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  rejectionReason!: string;
}
