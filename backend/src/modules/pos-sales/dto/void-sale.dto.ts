import { IsString, Length } from 'class-validator';

/**
 * Payload for `POST /pos/sales/:id/void`. The cashier (or supervisor)
 * must record a reason for the void — it's surfaced on the audit trail
 * via the Sale.voidedReason column and copied into the reversing
 * stock_movements and credit_transactions notes.
 *
 * Length range is 3..255 chars: long enough to be meaningful, short
 * enough that the DB column (varchar(255)) won't truncate. The minimum
 * three characters discourages drive-by " " or "n/a" voids.
 */
export class VoidSaleDto {
  @IsString()
  @Length(3, 255)
  reason!: string;
}
