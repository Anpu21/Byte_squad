import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  // Hex (#RRGGBB) or a short design token used for the chip + analytics bar.
  @IsString()
  @IsOptional()
  @MaxLength(16)
  color?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
