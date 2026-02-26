import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsNotEmpty()
    barcode!: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsNotEmpty()
    category!: string;

    @IsNumber()
    @Min(0)
    costPrice!: number;

    @IsNumber()
    @Min(0)
    sellingPrice!: number;

    @IsString()
    @IsOptional()
    imageUrl?: string;
}
