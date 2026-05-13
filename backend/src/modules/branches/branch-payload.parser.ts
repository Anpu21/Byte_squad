import { ConflictException } from '@nestjs/common';
import { CreateBranchDto } from '@branches/dto/create-branch.dto';
import { UpdateBranchDto } from '@branches/dto/update-branch.dto';
import { PendingBranchActionPayload } from '@branches/entities/pending-branch-action.entity';

// Runtime parsers for `pending_branch_actions.payload` (a jsonb column typed as
// Record<string, unknown> | null). We can't trust the row to match the original
// DTO shape, so we narrow each field instead of asserting it.

function asObject(raw: PendingBranchActionPayload): Record<string, unknown> {
  if (raw === null || typeof raw !== 'object') {
    throw new ConflictException('Pending branch action payload is malformed');
  }
  return raw;
}

function readString(
  source: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = source[key];
  return typeof value === 'string' ? value : undefined;
}

function readBoolean(
  source: Record<string, unknown>,
  key: string,
): boolean | undefined {
  const value = source[key];
  return typeof value === 'boolean' ? value : undefined;
}

function requireString(source: Record<string, unknown>, key: string): string {
  const value = readString(source, key);
  if (value === undefined) {
    throw new ConflictException(
      `Pending branch action payload is missing required field "${key}"`,
    );
  }
  return value;
}

export function parseCreateBranchPayload(
  raw: PendingBranchActionPayload,
): CreateBranchDto {
  const source = asObject(raw);
  const dto = new CreateBranchDto();
  dto.code = requireString(source, 'code');
  dto.name = requireString(source, 'name');
  dto.addressLine1 = requireString(source, 'addressLine1');
  dto.addressLine2 = readString(source, 'addressLine2');
  dto.city = readString(source, 'city');
  dto.state = readString(source, 'state');
  dto.country = readString(source, 'country');
  dto.postalCode = readString(source, 'postalCode');
  dto.phone = readString(source, 'phone');
  dto.email = readString(source, 'email');
  return dto;
}

export function parseUpdateBranchPayload(
  raw: PendingBranchActionPayload,
): UpdateBranchDto {
  const source = asObject(raw);
  const dto = new UpdateBranchDto();
  dto.code = readString(source, 'code');
  dto.name = readString(source, 'name');
  dto.addressLine1 = readString(source, 'addressLine1');
  dto.addressLine2 = readString(source, 'addressLine2');
  dto.city = readString(source, 'city');
  dto.state = readString(source, 'state');
  dto.country = readString(source, 'country');
  dto.postalCode = readString(source, 'postalCode');
  dto.phone = readString(source, 'phone');
  dto.email = readString(source, 'email');
  dto.isActive = readBoolean(source, 'isActive');
  return dto;
}
