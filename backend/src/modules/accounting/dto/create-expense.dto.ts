import {
    IsDateString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Min,
} from 'class-validator';

export class CreateExpenseDto {
    @IsUUID()
    branchId!: string;

    @IsString()
    @IsNotEmpty()
    category!: string;

    @IsNumber()
    @Min(0)
    amount!: number;

    @IsString()
    @IsNotEmpty()
    description!: string;

    @IsDateString()
    expenseDate!: string;

    @IsString()
    @IsOptional()
    receiptUrl?: string;
}
