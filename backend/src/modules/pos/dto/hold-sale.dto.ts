import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { HeldSaleSnapshot } from '@pos/types/held-sale-snapshot.type';

export class HoldSaleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  label!: string;

  @IsInt()
  @Min(1)
  @Max(1000)
  itemCount!: number;

  @IsNumber()
  @Min(0)
  @Max(100_000_000)
  total!: number;

  /**
   * Opaque cart snapshot. Validated only as an object — its inner shape is
   * the frontend's concern and is re-validated at checkout, so it is stored
   * verbatim (the global whitelist pipe does not strip un-typed nested keys).
   */
  @IsObject()
  snapshot!: HeldSaleSnapshot;
}
