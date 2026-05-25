import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateSalaryStructureDto } from '@/modules/hr/dto/create-salary-structure.dto';

/**
 * Body DTO for `PATCH /hr/salary-structures/:id`. All fields optional
 * — the service merges them onto the existing row. `employeeId` is
 * stripped because ownership transfer is not a supported workflow: a
 * structure belongs to one employee for its entire lifetime, and a
 * different employee always gets a brand-new row.
 */
export class UpdateSalaryStructureDto extends PartialType(
  OmitType(CreateSalaryStructureDto, ['employeeId'] as const),
) {}
