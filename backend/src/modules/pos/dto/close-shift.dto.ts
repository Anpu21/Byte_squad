import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CloseShiftDto {
  /** Physically counted drawer cash at close. */
  @IsNumber()
  @Min(0)
  @Max(10_000_000)
  countedCash!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
