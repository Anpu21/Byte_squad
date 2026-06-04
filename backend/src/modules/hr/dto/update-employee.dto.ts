import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeDto } from '@/modules/hr/dto/create-employee.dto';

/**
 * Body DTO for `PATCH /hr/employees/:id`. All fields optional — the
 * service merges them onto the existing row. Conflict checks for
 * `employeeCode` and `nic` happen only when the field is actually
 * changing.
 */
export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}
