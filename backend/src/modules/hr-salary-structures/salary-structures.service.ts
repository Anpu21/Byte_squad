import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserRole } from '@common/enums/user-roles.enums';
import { SalaryStructuresRepository } from '@/modules/hr-salary-structures/salary-structures.repository';
import { EmployeesRepository } from '@/modules/hr-employees/employees.repository';
import { Employee } from '@/modules/hr-employees/entities/employee.entity';
import { SalaryStructure } from '@/modules/hr-salary-structures/entities/salary-structure.entity';
import { CreateSalaryStructureDto } from '@/modules/hr-salary-structures/dto/create-salary-structure.dto';
import { UpdateSalaryStructureDto } from '@/modules/hr-salary-structures/dto/update-salary-structure.dto';

export interface SalaryActor {
  id: string;
  role: UserRole;
  branchId: string | null;
}

/**
 * Per-employee compensation. Scope rides on the owning employee's
 * `branchId`: managers may only operate on structures belonging to
 * employees in their branch; admins span every branch.
 *
 * The "at most one Active row per employee on a given date"
 * invariant is enforced here (not at DB level — see the repository
 * docstring) by deactivating any open-ended Active structure inside
 * the same transaction as the insert. Two concurrent creates would
 * still serialise on the row update, so the invariant holds even
 * under contention.
 */
@Injectable()
export class SalaryStructuresService {
  constructor(
    private readonly structures: SalaryStructuresRepository,
    private readonly employees: EmployeesRepository,
    private readonly dataSource: DataSource,
  ) {}

  async list(
    employeeId: string,
    actor: SalaryActor,
  ): Promise<SalaryStructure[]> {
    await this.resolveEmployee(employeeId, actor);
    return this.structures.listForEmployee(employeeId);
  }

  async getById(id: string, actor: SalaryActor): Promise<SalaryStructure> {
    const structure = await this.structures.findById(id);
    if (!structure) throw new NotFoundException('Salary structure not found');
    await this.resolveEmployee(structure.employeeId, actor);
    return structure;
  }

  /**
   * Insert a new structure. If the employee already has an Active
   * structure with no `effectiveToDate`, that row is deactivated
   * inside the same transaction — `effectiveToDate` is stamped one
   * day before the new structure's `effectiveFromDate` so the
   * timeline has no gap and no overlap.
   *
   * Returns the freshly-inserted row.
   */
  async create(
    dto: CreateSalaryStructureDto,
    actor: SalaryActor,
  ): Promise<SalaryStructure> {
    const employee = await this.resolveEmployee(dto.employeeId, actor);
    const effectiveFrom = new Date(dto.effectiveFromDate);

    return this.dataSource.transaction(async (manager) => {
      const open = (await this.structures.listForEmployee(employee.id)).find(
        (s) => s.status === 'Active' && s.effectiveToDate === null,
      );
      if (open) {
        const closeDate = new Date(effectiveFrom);
        closeDate.setUTCDate(closeDate.getUTCDate() - 1);
        await this.structures.deactivate(open.id, closeDate, manager);
      }

      return this.structures.save(
        {
          employeeId: employee.id,
          salaryType: dto.salaryType,
          monthlyBase: dto.monthlyBase ?? 0,
          dailyRate: dto.dailyRate ?? 0,
          productionRatePerCard: dto.productionRatePerCard ?? 0,
          teaAllowanceDaily: dto.teaAllowanceDaily ?? 60,
          otRatePerHour: dto.otRatePerHour ?? 400,
          attendanceBonusAmount: dto.attendanceBonusAmount ?? 0,
          effectiveFromDate: effectiveFrom,
          effectiveToDate: dto.effectiveToDate
            ? new Date(dto.effectiveToDate)
            : null,
          status: 'Active',
          notes: dto.notes ?? null,
          createdBy: actor.id,
        },
        manager,
      );
    });
  }

  /**
   * Update an existing structure in place. The service rejects edits
   * that would push the row's effective window into an overlap with
   * another Active structure for the same employee — the simpler
   * mental model than allowing edits to silently mutate the active
   * timeline.
   */
  async update(
    id: string,
    dto: UpdateSalaryStructureDto,
    actor: SalaryActor,
  ): Promise<SalaryStructure> {
    const existing = await this.getById(id, actor);

    const nextFrom = dto.effectiveFromDate
      ? new Date(dto.effectiveFromDate)
      : existing.effectiveFromDate;
    const nextTo =
      dto.effectiveToDate !== undefined
        ? dto.effectiveToDate
          ? new Date(dto.effectiveToDate)
          : null
        : existing.effectiveToDate;

    const others = (
      await this.structures.listForEmployee(existing.employeeId)
    ).filter((s) => s.id !== id && s.status === 'Active');
    for (const other of others) {
      const otherTo = other.effectiveToDate ?? new Date('9999-12-31');
      const thisTo = nextTo ?? new Date('9999-12-31');
      const overlaps = nextFrom <= otherTo && other.effectiveFromDate <= thisTo;
      if (overlaps) {
        throw new ConflictException(
          'Updated date range would overlap another Active salary structure',
        );
      }
    }

    const updated = await this.structures.updatePartial(id, {
      salaryType: dto.salaryType ?? existing.salaryType,
      monthlyBase: dto.monthlyBase ?? existing.monthlyBase,
      dailyRate: dto.dailyRate ?? existing.dailyRate,
      productionRatePerCard:
        dto.productionRatePerCard ?? existing.productionRatePerCard,
      teaAllowanceDaily: dto.teaAllowanceDaily ?? existing.teaAllowanceDaily,
      otRatePerHour: dto.otRatePerHour ?? existing.otRatePerHour,
      attendanceBonusAmount:
        dto.attendanceBonusAmount ?? existing.attendanceBonusAmount,
      effectiveFromDate: nextFrom,
      effectiveToDate: nextTo,
      notes: dto.notes ?? existing.notes,
    });
    if (!updated) {
      throw new NotFoundException('Salary structure vanished after update');
    }
    return updated;
  }

  /**
   * Close-out endpoint. Flips status to `Inactive` and stamps
   * `effectiveToDate` to today. Used by HR when an employee leaves
   * without a successor structure (e.g. termination).
   */
  async deactivate(id: string, actor: SalaryActor): Promise<SalaryStructure> {
    const existing = await this.getById(id, actor);
    if (existing.status === 'Inactive') {
      throw new ConflictException('Salary structure is already inactive');
    }
    await this.structures.deactivate(id, new Date());
    const updated = await this.structures.findById(id);
    if (!updated) {
      throw new NotFoundException('Salary structure vanished after deactivate');
    }
    return updated;
  }

  /**
   * Public hook for the payroll generator (BE-H6). Routes through
   * scope-checking so a manager calling the generator on a
   * cross-branch employee still hits a 403 before any compute work.
   */
  async getActiveOn(
    employeeId: string,
    date: Date,
    actor: SalaryActor,
  ): Promise<SalaryStructure | null> {
    await this.resolveEmployee(employeeId, actor);
    return this.structures.findActiveOn(employeeId, date);
  }

  private async resolveEmployee(
    employeeId: string,
    actor: SalaryActor,
  ): Promise<Employee> {
    const employee = await this.employees.findById(employeeId);
    if (!employee) throw new NotFoundException('Employee not found');
    if (actor.role !== UserRole.ADMIN && employee.branchId !== actor.branchId) {
      throw new ForbiddenException(
        'Cannot access salary structures outside your branch',
      );
    }
    return employee;
  }
}
