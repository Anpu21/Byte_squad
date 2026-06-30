import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class EmailReceiptDto {
  /**
   * Base64-encoded PDF of the receipt (no data-URI prefix), rendered on the
   * client. Capped to bound the request body; the server only forwards it as
   * an email attachment.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(5_000_000)
  pdfBase64!: string;
}
