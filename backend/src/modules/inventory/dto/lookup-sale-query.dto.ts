import { IsString, MaxLength } from 'class-validator';

export class LookupSaleQueryDto {
  @IsString()
  @MaxLength(64)
  invoiceNumber!: string;
}
