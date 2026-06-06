import { IsUUID } from 'class-validator';

/** Assign (or reassign) the courier employee responsible for a shipment. */
export class AssignCourierDto {
  @IsUUID()
  courierEmployeeId!: string;
}
