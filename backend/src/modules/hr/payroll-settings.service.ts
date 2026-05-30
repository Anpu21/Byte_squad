import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@common/enums/user-roles.enums';
import { PayrollSettingsRepository } from '@/modules/hr/payroll-settings.repository';
import { PayrollSettings } from '@/modules/hr/entities/payroll-settings.entity';
import { UpdatePayrollSettingsDto } from '@/modules/hr/dto/update-payroll-settings.dto';
import { UpsertBranchPayrollSettingsDto } from '@/modules/hr/dto/upsert-branch-payroll-settings.dto';

export interface PayrollSettingsActor {
  id: string;
  role: UserRole;
  branchId: string | null;
}

/**
 * Branch-aware payroll settings. Reads route through
 * `findEffective(branchId)` so the same fallback logic
 * (branch row > global row) is applied at every read site.
 *
 * Mutation rules:
 *   - Admin can update global + any branch.
 *   - Manager can upsert only their own branch and cannot touch
 *     global.
 */
@Injectable()
export class PayrollSettingsService {
  constructor(private readonly settings: PayrollSettingsRepository) {}

  async getGlobal(): Promise<PayrollSettings> {
    const global = await this.settings.findGlobal();
    if (!global) {
      throw new InternalServerErrorException(
        'Global payroll settings row is missing — re-run HR migrations',
      );
    }
    return global;
  }

  /**
   * Branch-first resolver. The HR services lean on this for runtime
   * lookup of statutory rates + grace windows so any per-branch
   * override is honoured without round-tripping through the global
   * row.
   */
  getEffective(branchId: string | null): Promise<PayrollSettings> {
    return this.settings.findEffective(branchId);
  }

  async updateGlobal(
    dto: UpdatePayrollSettingsDto,
    actor: PayrollSettingsActor,
  ): Promise<PayrollSettings> {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only admins can update global payroll settings',
      );
    }
    const global = await this.getGlobal();
    const updated = await this.settings.updatePartial(global.id, dto);
    if (!updated) {
      throw new NotFoundException(
        'Global payroll settings vanished after update',
      );
    }
    return updated;
  }

  /**
   * Upsert a per-branch override. Admin can target any branch;
   * managers can only touch their own. When no row exists yet we
   * insert one stamped with `createdBy = actor.id`; otherwise we
   * patch the existing row in place.
   */
  async upsertBranch(
    dto: UpsertBranchPayrollSettingsDto,
    actor: PayrollSettingsActor,
  ): Promise<PayrollSettings> {
    if (actor.role !== UserRole.ADMIN && actor.branchId !== dto.branchId) {
      throw new ForbiddenException(
        'Cannot configure payroll settings outside your branch',
      );
    }

    const existing = await this.settings.findByBranch(dto.branchId);
    if (existing) {
      const patched = await this.settings.updatePartial(existing.id, {
        epfEmployeePercent:
          dto.epfEmployeePercent ?? existing.epfEmployeePercent,
        epfEmployerPercent:
          dto.epfEmployerPercent ?? existing.epfEmployerPercent,
        etfEmployerPercent:
          dto.etfEmployerPercent ?? existing.etfEmployerPercent,
        attendanceBonusThreshold:
          dto.attendanceBonusThreshold ?? existing.attendanceBonusThreshold,
        lateGraceMinutes: dto.lateGraceMinutes ?? existing.lateGraceMinutes,
      });
      if (!patched) {
        throw new NotFoundException(
          'Branch payroll settings vanished after update',
        );
      }
      return patched;
    }

    return this.settings.save({
      branchId: dto.branchId,
      epfEmployeePercent: dto.epfEmployeePercent,
      epfEmployerPercent: dto.epfEmployerPercent,
      etfEmployerPercent: dto.etfEmployerPercent,
      attendanceBonusThreshold: dto.attendanceBonusThreshold,
      lateGraceMinutes: dto.lateGraceMinutes,
      createdBy: actor.id,
    });
  }
}
