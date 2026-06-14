import { IsString, MaxLength, MinLength } from 'class-validator';

/** Abort an in-transit shipment and re-credit the source branch (F4). */
export class ReturnShipmentDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}
