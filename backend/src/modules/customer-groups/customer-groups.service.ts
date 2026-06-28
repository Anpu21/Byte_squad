import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { CustomerGroup } from '@/modules/customer-groups/entities/customer-group.entity';
import { CustomerGroupMember } from '@/modules/customer-groups/entities/customer-group-member.entity';
import { CustomerGroupsRepository } from '@/modules/customer-groups/customer-groups.repository';
import { CreateCustomerGroupDto } from '@/modules/customer-groups/dto/create-customer-group.dto';
import { JoinCustomerGroupDto } from '@/modules/customer-groups/dto/join-customer-group.dto';
import { UpdateCustomerGroupDto } from '@/modules/customer-groups/dto/update-customer-group.dto';
import { CustomerGroupStatus } from '@common/enums/customer-group-status.enum';
import { CustomerGroupMemberRole } from '@common/enums/customer-group-member-role.enum';
import type { AuthUser } from '@common/types/auth-user.type';
import type {
  CustomerGroupDetail,
  CustomerGroupMemberView,
  CustomerGroupSummary,
} from '@/modules/customer-groups/types';

// Ambiguity-free alphabet (no 0/O/1/I) for human-shareable join codes.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

@Injectable()
export class CustomerGroupsService {
  constructor(private readonly groups: CustomerGroupsRepository) {}

  async create(
    dto: CreateCustomerGroupDto,
    actor: AuthUser,
  ): Promise<CustomerGroupDetail> {
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Group name is required');
    }
    const joinCode = await this.generateUniqueJoinCode();
    const saved = await this.groups.createGroupWithOwner(
      this.groups.createGroup({
        name,
        joinCode,
        ownerUserId: actor.id,
        status: CustomerGroupStatus.ACTIVE,
      }),
    );
    return this.getById(saved.id, actor.id);
  }

  async listMine(actor: AuthUser): Promise<CustomerGroupSummary[]> {
    const memberships = await this.groups.listMembershipsForUser(actor.id);
    const counts = await this.groups.memberCountsByGroup(
      memberships.map((m) => m.customerGroupId),
    );
    return memberships.map((m) =>
      this.toSummary(m.group, m.role, counts.get(m.customerGroupId) ?? 0),
    );
  }

  async getById(id: string, userId: string): Promise<CustomerGroupDetail> {
    const { group, membership } = await this.assertMembership(id, userId);
    const members = await this.groups.listMembers(id);
    return {
      ...this.toSummary(group, membership.role, members.length),
      members: members.map((m) => this.toMemberView(m)),
    };
  }

  async join(
    dto: JoinCustomerGroupDto,
    actor: AuthUser,
  ): Promise<CustomerGroupDetail> {
    const code = dto.joinCode.trim().toUpperCase();
    const group = await this.groups.findByJoinCode(code);
    if (!group || group.status !== CustomerGroupStatus.ACTIVE) {
      throw new NotFoundException('No active group found for that code');
    }
    const existing = await this.groups.findMembership(group.id, actor.id);
    if (!existing) {
      // Joining the same link twice is a no-op — fall through to return detail.
      await this.groups.saveMember(
        this.groups.createMember({
          customerGroupId: group.id,
          userId: actor.id,
          role: CustomerGroupMemberRole.MEMBER,
        }),
      );
    }
    return this.getById(group.id, actor.id);
  }

  async update(
    id: string,
    dto: UpdateCustomerGroupDto,
    actor: AuthUser,
  ): Promise<CustomerGroupDetail> {
    const group = await this.assertOwner(id, actor.id);
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('Group name is required');
      }
      group.name = name;
    }
    if (dto.status !== undefined) {
      group.status = dto.status;
    }
    await this.groups.saveGroup(group);
    return this.getById(id, actor.id);
  }

  async regenerateCode(
    id: string,
    actor: AuthUser,
  ): Promise<CustomerGroupDetail> {
    const group = await this.assertOwner(id, actor.id);
    group.joinCode = await this.generateUniqueJoinCode();
    await this.groups.saveGroup(group);
    return this.getById(id, actor.id);
  }

  async leave(id: string, actor: AuthUser): Promise<void> {
    const { membership } = await this.assertMembership(id, actor.id);
    if (membership.role === CustomerGroupMemberRole.OWNER) {
      throw new BadRequestException(
        'The owner cannot leave the group — transfer ownership or archive it instead',
      );
    }
    await this.groups.deleteMember(id, actor.id);
  }

  async removeMember(
    id: string,
    memberUserId: string,
    actor: AuthUser,
  ): Promise<CustomerGroupDetail> {
    await this.assertOwner(id, actor.id);
    if (memberUserId === actor.id) {
      throw new BadRequestException(
        'The owner cannot remove themselves — archive the group instead',
      );
    }
    const membership = await this.groups.findMembership(id, memberUserId);
    if (!membership) {
      throw new NotFoundException('That user is not a member of this group');
    }
    await this.groups.deleteMember(id, memberUserId);
    return this.getById(id, actor.id);
  }

  /**
   * Assert the user belongs to the group; returns the group + membership.
   * Shared by every member-scoped action (the cart + analytics phases reuse it).
   * Throws NotFound for a missing group, Forbidden for a non-member.
   */
  async assertMembership(
    groupId: string,
    userId: string,
  ): Promise<{ group: CustomerGroup; membership: CustomerGroupMember }> {
    const group = await this.groups.findById(groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    const membership = await this.groups.findMembership(groupId, userId);
    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }
    return { group, membership };
  }

  private async assertOwner(
    groupId: string,
    userId: string,
  ): Promise<CustomerGroup> {
    const { group, membership } = await this.assertMembership(groupId, userId);
    if (membership.role !== CustomerGroupMemberRole.OWNER) {
      throw new ForbiddenException('Only the group owner can do that');
    }
    return group;
  }

  private toSummary(
    group: CustomerGroup,
    myRole: CustomerGroupMemberRole,
    memberCount: number,
  ): CustomerGroupSummary {
    return {
      id: group.id,
      name: group.name,
      joinCode: group.joinCode,
      status: group.status,
      ownerUserId: group.ownerUserId,
      myRole,
      memberCount,
      createdAt: group.createdAt,
    };
  }

  private toMemberView(member: CustomerGroupMember): CustomerGroupMemberView {
    const user = member.user;
    const name = `${user.firstName} ${user.lastName}`.trim();
    return {
      userId: member.userId,
      name: name || user.email,
      email: user.email,
      role: member.role,
      joinedAt: member.joinedAt,
    };
  }

  private async generateUniqueJoinCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const bytes = crypto.randomBytes(8);
      let code = 'FAM-';
      for (let i = 0; i < 8; i++) {
        code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
      }
      if (!(await this.groups.existsByJoinCode(code))) {
        return code;
      }
    }
    throw new InternalServerErrorException(
      'Failed to generate a unique join code',
    );
  }
}
