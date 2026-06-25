import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EmployeesRepository,
  type EmployeeStatus,
} from '@/modules/hr-employees/employees.repository';
import { Employee } from '@/modules/hr-employees/entities/employee.entity';
import { CreateEmployeeDto } from '@/modules/hr-employees/dto/create-employee.dto';
import { UpdateEmployeeDto } from '@/modules/hr-employees/dto/update-employee.dto';
import { ListEmployeesQueryDto } from '@/modules/hr-employees/dto/list-employees-query.dto';
import { TerminateEmployeeDto } from '@/modules/hr-employees/dto/terminate-employee.dto';
import { CloudinaryService } from '@common/cloudinary/cloudinary.service';
import { UserRole } from '@common/enums/user-roles.enums';

export interface EmployeesListActor {
  id: string;
  role: UserRole;
  branchId: string | null;
}

export interface EmployeesListResponse {
  rows: Employee[];
  total: number;
  limit: number;
  offset: number;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const CLOUDINARY_FOLDER = 'ledgerpro/employees';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly employees: EmployeesRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  /**
   * Branch-scoped list. Managers are pinned to their own branch
   * regardless of the `branchId` query param — the URL cannot widen
   * scope. Admins may pass `branchId` to filter, or omit it to span
   * every branch.
   */
  async list(
    query: ListEmployeesQueryDto,
    actor: EmployeesListActor,
  ): Promise<EmployeesListResponse> {
    const limit = Math.min(
      Math.max(query.limit ?? DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    );
    const offset = Math.max(query.offset ?? 0, 0);
    const branchId =
      actor.role === UserRole.ADMIN
        ? query.branchId
        : (actor.branchId ?? undefined);

    const { rows, total } = await this.employees.listForBranch({
      branchId,
      search: query.search,
      status: query.status as EmployeeStatus | undefined,
      limit,
      offset,
    });
    return { rows, total, limit, offset };
  }

  /**
   * Single-row read. Reused by every mutation as the scoped guard —
   * if the actor cannot see the employee they cannot edit them
   * either, and missing rows surface as 404 instead of leaking
   * existence via 403.
   */
  async getById(id: string, actor: EmployeesListActor): Promise<Employee> {
    const employee = await this.employees.findById(id);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    if (actor.role !== UserRole.ADMIN && employee.branchId !== actor.branchId) {
      throw new ForbiddenException(
        'Cannot access employees outside your branch',
      );
    }
    return employee;
  }

  async create(
    dto: CreateEmployeeDto,
    actor: EmployeesListActor,
  ): Promise<Employee> {
    if (actor.role !== UserRole.ADMIN && dto.branchId !== actor.branchId) {
      throw new ForbiddenException(
        'Cannot create employees outside your branch',
      );
    }

    // Cheap pre-flight conflict checks. DB partial unique indexes on
    // employee_code + nic are the real backstop, but surfacing the
    // friendly error here saves a round-trip through a 500.
    const existingByCode = await this.employees.findByEmployeeCode(
      dto.employeeCode,
    );
    if (existingByCode) {
      throw new ConflictException(
        `Employee code ${dto.employeeCode} is already in use`,
      );
    }
    if (dto.nic) {
      const existingByNic = await this.employees.findByNic(dto.nic);
      if (existingByNic) {
        throw new ConflictException(`NIC ${dto.nic} is already on file`);
      }
    }

    return this.employees.save({ ...dto, createdBy: actor.id });
  }

  async update(
    id: string,
    dto: UpdateEmployeeDto,
    actor: EmployeesListActor,
  ): Promise<Employee> {
    const existing = await this.getById(id, actor);

    // Managers cannot transfer an employee to another branch. Admins
    // may; this is the cross-branch move workflow.
    if (
      dto.branchId &&
      dto.branchId !== existing.branchId &&
      actor.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Cannot transfer employee to a different branch',
      );
    }

    if (dto.employeeCode && dto.employeeCode !== existing.employeeCode) {
      const dup = await this.employees.findByEmployeeCode(dto.employeeCode);
      if (dup) {
        throw new ConflictException(
          `Employee code ${dto.employeeCode} is already in use`,
        );
      }
    }
    if (dto.nic && dto.nic !== existing.nic) {
      const dup = await this.employees.findByNic(dto.nic);
      if (dup) {
        throw new ConflictException(`NIC ${dto.nic} is already on file`);
      }
    }

    const updated = await this.employees.updatePartial(id, dto);
    if (!updated) {
      throw new NotFoundException('Employee not found after update');
    }
    return updated;
  }

  /**
   * Soft termination. The row stays so payroll history is intact;
   * status flips to `Terminated`, and we stamp `terminationDate` +
   * `terminationReason` for the audit trail. Re-terminating an
   * already-terminated employee is a 409 — the cashier UI should
   * filter terminated rows out of the action set.
   */
  async terminate(
    id: string,
    dto: TerminateEmployeeDto,
    actor: EmployeesListActor,
  ): Promise<Employee> {
    const existing = await this.getById(id, actor);
    if (existing.status === 'Terminated') {
      throw new ConflictException('Employee is already terminated');
    }
    await this.employees.softTerminate(
      id,
      dto.reason,
      new Date(dto.terminationDate),
    );
    const updated = await this.employees.findById(id);
    if (!updated) {
      throw new NotFoundException('Employee not found after termination');
    }
    return updated;
  }

  /**
   * Multipart photo upload. Pipes the file through the shared
   * Cloudinary integration (same pattern as `ProductsService.setImage`)
   * and persists the returned `secure_url` on `Employee.photoUrl`. The
   * Cloudinary folder is `ledgerpro/employees/{id}` so we can prune
   * orphans branch-by-branch later if needed.
   */
  async uploadPhoto(
    id: string,
    file: Express.Multer.File,
    actor: EmployeesListActor,
  ): Promise<Employee> {
    await this.getById(id, actor);

    let photoUrl: string | null;
    if (this.cloudinary.isEnabled()) {
      const { url } = await this.cloudinary.uploadImage(file, {
        folder: CLOUDINARY_FOLDER,
        publicId: id,
      });
      photoUrl = url;
    } else {
      // Same fallback shape as products — base64 data URL embedded on
      // the row when Cloudinary credentials are not configured (dev /
      // CI).
      photoUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    }

    await this.employees.setPhotoUrl(id, photoUrl);
    const updated = await this.employees.findById(id);
    if (!updated) {
      throw new NotFoundException('Employee not found after photo upload');
    }
    return updated;
  }
}
