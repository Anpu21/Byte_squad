import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

/**
 * Bundle a set of already-approved transfer lines into one courier shipment.
 * All lines must share the same source + destination branch and not already
 * belong to a shipment (validated server-side).
 */
export class CreateShipmentDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  lineIds!: string[];

  @IsOptional()
  @IsUUID()
  courierEmployeeId?: string;

  /** Optional ETA hint in hours from dispatch (1h–30d). */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(720)
  etaHours?: number;
}
