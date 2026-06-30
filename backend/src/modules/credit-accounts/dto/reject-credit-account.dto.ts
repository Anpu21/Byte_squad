import { IsString, MaxLength } from 'class-validator';

/** Manager rejection of a PENDING enrollment request. */
export class RejectCreditAccountDto {
  @IsString()
  @MaxLength(500)
  rejectionReason!: string;
}
