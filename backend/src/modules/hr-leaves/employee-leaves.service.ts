import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserRole } from '@common/enums/user-roles.enums';
import { EmployeeLeavesRepository } from '@/modules/hr-leaves/employee-leaves.repository';
import { EmployeesRepository } from '@/modules/hr-employees/employees.repository';
import { Employee } from '@/modules/hr-employees/entities/employee.entity';
import { EmployeeLeave } from '@/modules/hr-leaves/entities/employee-leave.entity';
import { ApplyLeaveDto } from '@/modules/hr-leaves/dto/apply-leave.dto';
import { ListLeavesQueryDto } from '@/modules/hr-leaves/dto/list-leaves-query.dto';
import { RejectLeaveDto } from '@/modules/hr-leaves/dto/reject-leave.dto';
import { UsersService } from '@/modules/users/users.service';

export interface LeavesActor {
  id: string;
  role: UserRole;
  branchId: string | null;
}

export interface LeavesListResponse {
  rows: EmployeeLeave[];
  total: number;
  limit: number;
  offset: number;
}

@Injectable()
export class EmployeeLeavesService {
  constructor(
    private readonly leaves: EmployeeLeavesRepository,
    private readonly employees: EmployeesRepository,
    private readonly users: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Branch-scoped list. Cashiers can only see their own leaves (the
   * service forces `employeeId` to the actor's employee). Managers
   * see their branch; admins span every branch unless they pass a
   * `branchId` filter.
   */
  async list(
    query: ListLeavesQueryDto,
    actor: LeavesActor,
  ): Promise<LeavesListResponse> {
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const offset = Math.max(query.offset ?? 0, 0);
    let branchId: string | undefined;
    let employeeId = query.employeeId;

    if (actor.role === UserRole.CASHIER) {
      const own = await this.findEmployeeForActor(actor);
      employeeId = own.id;
      branchId = own.branchId;
    } else if (actor.role !== UserRole.ADMIN) {
      // Manager pinned to own branch regardless of query.branchId.
      branchId = actor.branchId ?? undefined;
    } else {
      branchId = query.branchId;
    }

    const { rows, total } = await this.leaves.listForBranch({
      branchId,
      employeeId,
      status: query.status,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      limit,
      offset,
    });
    return { rows, total, limit, offset };
  }

  async getById(id: string, actor: LeavesActor): Promise<EmployeeLeave> {
    const leave = await this.leaves.findById(id);
    if (!leave) throw new NotFoundException('Leave not found');
    await this.assertVisible(leave, actor);
    return leave;
  }

  /**
   * Apply for a new leave. An omitted `employeeId` targets the
   * actor's own employee record (cashier self-apply, manager
   * applying for themselves). Cashiers can only apply for themselves
   * — a different explicit `employeeId` raises 403 instead of being
   * silently swallowed. Managers/admins may apply on-behalf, subject
   * to branch scope. Rejects overlapping Pending/Approved leaves
   * (409) and Annual leaves that would drive the running balance
   * negative (422 BadRequest).
   */
  async apply(dto: ApplyLeaveDto, actor: LeavesActor): Promise<EmployeeLeave> {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (start.getTime() > end.getTime()) {
      throw new BadRequestException('startDate must be on or before endDate');
    }

    const employee = await this.resolveEmployeeForApply(dto, actor);

    const conflicts = await this.leaves.findOverlapping(
      employee.id,
      start,
      end,
    );
    if (conflicts.length > 0) {
      throw new ConflictException(
        'Employee already has a Pending or Approved leave overlapping this date range',
      );
    }

    if (dto.leaveType === 'Annual') {
      const balance = Number(employee.annualLeaveBalance);
      if (balance < dto.totalDays) {
        throw new BadRequestException(
          `Insufficient annual leave balance: ${balance} day(s) available, ${dto.totalDays} requested`,
        );
      }
    }

    return this.leaves.save({
      employeeId: employee.id,
      leaveType: dto.leaveType,
      startDate: start,
      endDate: end,
      totalDays: dto.totalDays,
      reason: dto.reason ?? null,
      notes: dto.notes ?? null,
      status: 'Pending',
      appliedDate: new Date(),
    });
  }

  /**
   * Approve a Pending leave. Inside a single transaction, flips
   * status to Approved and (for Annual leave) decrements the
   * employee's running balance via the atomic SQL-side update on
   * EmployeesRepository — so two managers racing on overlapping
   * approvals can't drive the wallet negative.
   */
  async approve(id: string, actor: LeavesActor): Promise<EmployeeLeave> {
    const existing = await this.getById(id, actor);
    await this.assertCanModerate(existing, actor);
    if (existing.status !== 'Pending') {
      throw new ConflictException(
        `Cannot approve leave in status ${existing.status}`,
      );
    }

    await this.dataSource.transaction(async (manager) => {
      await this.leaves.updatePartial(
        id,
        {
          status: 'Approved',
          approvedBy: actor.id,
          approvedDate: new Date(),
        },
        manager,
      );
      if (existing.leaveType === 'Annual') {
        await this.employees.adjustAnnualLeaveBalance(
          existing.employeeId,
          -existing.totalDays,
          manager,
        );
      }
    });

    const updated = await this.leaves.findById(id);
    if (!updated) throw new NotFoundException('Leave vanished after approval');
    return updated;
  }

  async reject(
    id: string,
    dto: RejectLeaveDto,
    actor: LeavesActor,
  ): Promise<EmployeeLeave> {
    const existing = await this.getById(id, actor);
    await this.assertCanModerate(existing, actor);
    if (existing.status !== 'Pending') {
      throw new ConflictException(
        `Cannot reject leave in status ${existing.status}`,
      );
    }
    const updated = await this.leaves.updatePartial(id, {
      status: 'Rejected',
      approvedBy: actor.id,
      approvedDate: new Date(),
      rejectionReason: dto.rejectionReason,
    });
    if (!updated) throw new NotFoundException('Leave vanished after rejection');
    return updated;
  }

  /**
   * Cancel a leave. Cashiers can only self-cancel while still
   * Pending. Manager/admin may cancel anytime, and if an Approved
   * Annual leave is being cancelled the balance decrement is
   * reverted so the wallet stays in lockstep.
   */
  async cancel(id: string, actor: LeavesActor): Promise<EmployeeLeave> {
    const existing = await this.getById(id, actor);
    if (existing.status === 'Cancelled' || existing.status === 'Rejected') {
      throw new ConflictException(
        `Cannot cancel leave in status ${existing.status}`,
      );
    }
    if (actor.role === UserRole.CASHIER && existing.status !== 'Pending') {
      throw new ForbiddenException(
        'Cashiers can only cancel their own leaves while still Pending',
      );
    }

    const shouldRevertBalance =
      existing.status === 'Approved' && existing.leaveType === 'Annual';

    await this.dataSource.transaction(async (manager) => {
      await this.leaves.updatePartial(id, { status: 'Cancelled' }, manager);
      if (shouldRevertBalance) {
        await this.employees.adjustAnnualLeaveBalance(
          existing.employeeId,
          +existing.totalDays,
          manager,
        );
      }
    });

    const updated = await this.leaves.findById(id);
    if (!updated)
      throw new NotFoundException('Leave vanished after cancellation');
    return updated;
  }

  private async resolveEmployeeForApply(
    dto: ApplyLeaveDto,
    actor: LeavesActor,
  ): Promise<Employee> {
    if (actor.role === UserRole.CASHIER) {
      const own = await this.findEmployeeForActor(actor);
      if (dto.employeeId && own.id !== dto.employeeId) {
        throw new ForbiddenException(
          'Cashiers can only apply for their own leave',
        );
      }
      return own;
    }
    if (!dto.employeeId) {
      // Manager/admin self-apply — same resolution as the cashier path.
      return this.findEmployeeForActor(actor);
    }
    const target = await this.employees.findById(dto.employeeId);
    if (!target) throw new NotFoundException('Employee not found');
    if (actor.role !== UserRole.ADMIN && target.branchId !== actor.branchId) {
      throw new ForbiddenException(
        'Cannot apply for an employee outside your branch',
      );
    }
    return target;
  }

  private async findEmployeeForActor(actor: LeavesActor): Promise<Employee> {
    const employee = await this.employees.findByUserId(actor.id);
    if (!employee) {
      throw new ForbiddenException('No employee record linked to your account');
    }
    return employee;
  }

  /**
   * Managers may only moderate (approve/reject) leaves of non-manager
   * staff in their branch. Their own leave — or any leave whose
   * applicant logs in as a manager/admin — needs an admin; otherwise
   * same-rank managers could approve each other or themselves.
   * Cancel is intentionally exempt so a manager can still withdraw
   * their own pending request.
   */
  private async assertCanModerate(
    leave: EmployeeLeave,
    actor: LeavesActor,
  ): Promise<void> {
    if (actor.role === UserRole.ADMIN) return;
    const employee = await this.employees.findById(leave.employeeId);
    if (!employee) throw new NotFoundException('Leave not found');
    if (employee.userId === actor.id) {
      throw new ForbiddenException('Your own leave requires admin approval');
    }
    if (!employee.userId) return;
    const applicant = await this.users.findEntityById(employee.userId);
    if (
      applicant &&
      (applicant.role === UserRole.MANAGER || applicant.role === UserRole.ADMIN)
    ) {
      throw new ForbiddenException('Manager leaves require admin approval');
    }
  }

  private async assertVisible(
    leave: EmployeeLeave,
    actor: LeavesActor,
  ): Promise<void> {
    if (actor.role === UserRole.ADMIN) return;
    const employee = await this.employees.findById(leave.employeeId);
    if (!employee) throw new NotFoundException('Leave not found');
    if (actor.role === UserRole.CASHIER) {
      const own = await this.findEmployeeForActor(actor);
      if (own.id !== employee.id) {
        throw new ForbiddenException(
          'You can only view your own leave records',
        );
      }
      return;
    }
    if (employee.branchId !== actor.branchId) {
      throw new ForbiddenException('Cannot access leaves outside your branch');
    }
  }
}
