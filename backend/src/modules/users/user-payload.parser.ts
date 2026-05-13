import { ConflictException } from '@nestjs/common';
import { UserRole } from '@common/enums/user-roles.enums';
import { CreateUserDto } from '@users/dto/create-user.dto';
import { UpdateUserDto } from '@users/dto/update-user.dto';
import { PendingUserActionPayload } from '@users/entities/pending-user-action.entity';

// Runtime parsers for `pending_user_actions.payload` (a jsonb column typed as
// Record<string, unknown> | null). The row was written from a validated DTO,
// but we still narrow each field to keep `confirmAction` type-safe without
// `as unknown as Foo` assertions.

function asObject(raw: PendingUserActionPayload): Record<string, unknown> {
  if (raw === null || typeof raw !== 'object') {
    throw new ConflictException('Pending user action payload is malformed');
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

function readNullableString(
  source: Record<string, unknown>,
  key: string,
): string | null | undefined {
  const value = source[key];
  if (value === null) return null;
  return typeof value === 'string' ? value : undefined;
}

function requireString(source: Record<string, unknown>, key: string): string {
  const value = readString(source, key);
  if (value === undefined) {
    throw new ConflictException(
      `Pending user action payload is missing required field "${key}"`,
    );
  }
  return value;
}

function requireRole(source: Record<string, unknown>): UserRole {
  const raw = source.role;
  if (
    typeof raw !== 'string' ||
    !Object.values(UserRole).includes(raw as UserRole)
  ) {
    throw new ConflictException(
      'Pending user action payload has an invalid role',
    );
  }
  return raw as UserRole;
}

function readRole(source: Record<string, unknown>): UserRole | undefined {
  const raw = source.role;
  if (raw === undefined) return undefined;
  if (
    typeof raw !== 'string' ||
    !Object.values(UserRole).includes(raw as UserRole)
  ) {
    throw new ConflictException(
      'Pending user action payload has an invalid role',
    );
  }
  return raw as UserRole;
}

export function parseCreateUserPayload(
  raw: PendingUserActionPayload,
): CreateUserDto {
  const source = asObject(raw);
  const dto = new CreateUserDto();
  dto.email = requireString(source, 'email');
  dto.firstName = requireString(source, 'firstName');
  dto.lastName = requireString(source, 'lastName');
  dto.role = requireRole(source);
  dto.branchId = requireString(source, 'branchId');
  dto.phone = readNullableString(source, 'phone');
  dto.address = readNullableString(source, 'address');
  return dto;
}

export function parseUpdateUserPayload(
  raw: PendingUserActionPayload,
): UpdateUserDto {
  const source = asObject(raw);
  const dto = new UpdateUserDto();
  dto.email = readString(source, 'email');
  dto.firstName = readString(source, 'firstName');
  dto.lastName = readString(source, 'lastName');
  dto.role = readRole(source);
  const branchId = readNullableString(source, 'branchId');
  if (branchId !== undefined) dto.branchId = branchId;
  dto.phone = readNullableString(source, 'phone');
  dto.address = readNullableString(source, 'address');
  return dto;
}
