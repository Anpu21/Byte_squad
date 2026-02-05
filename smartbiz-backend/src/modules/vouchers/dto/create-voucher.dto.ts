import {
    IsString,
    IsEnum,
    IsUUID,
    IsOptional,
    IsDateString,
    IsArray,
    ValidateNested,
    IsNumber,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VoucherType } from '@common/constants/accounting.enum';

export class VoucherEntryDto {
    @IsUUID()
    ledgerId: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    debitAmount?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    creditAmount?: number;

    @IsOptional()
    @IsString()
    narration?: string;

    @IsOptional()
    @IsUUID()
    itemId?: string;

    @IsOptional()
    @IsNumber()
    quantity?: number;

    @IsOptional()
    @IsNumber()
    rate?: number;
}

export class CreateVoucherDto {
    @IsEnum(VoucherType)
    voucherType: VoucherType;

    @IsDateString()
    voucherDate: string;

    @IsUUID()
    companyId: string;

    @IsOptional()
    @IsUUID()
    branchId?: string;

    @IsOptional()
    @IsString()
    narration?: string;

    @IsOptional()
    @IsString()
    referenceNumber?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VoucherEntryDto)
    entries: VoucherEntryDto[];
}
