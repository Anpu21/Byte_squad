import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  CASH_MOVEMENT_TYPES,
  type CashMovementType,
} from '@pos/types/cash-movement-type.type';

export class RecordCashMovementDto {
  @IsIn(CASH_MOVEMENT_TYPES as readonly string[])
  type!: CashMovementType;

  /** Cash added (PayIn) or removed (PayOut). Always positive. */
  @IsNumber()
  @Min(0.01)
  @Max(1_000_000)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
