import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

/**
 * Add one line to a group's shared cart. Mirrors the storefront CheckoutItemDto
 * — the server is the price authority, so no price is accepted from the client.
 */
export class AddGroupCartItemDto {
  @IsUUID()
  productId!: string;

  @IsUUID()
  branchId!: string;

  @IsOptional()
  @IsUUID()
  unitId?: string;

  @IsNumber()
  @Min(0.001)
  quantity!: number;

  /**
   * "Buy by amount": the firm cash for a loose line; server-validated against
   * quantity × unit price. Omit/null for normal by-weight / by-count lines.
   */
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;
}
