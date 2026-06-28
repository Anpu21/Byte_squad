import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CustomerGroup } from '@/modules/customer-groups/entities/customer-group.entity';
import { CustomerGroupMember } from '@/modules/customer-groups/entities/customer-group-member.entity';
import { CustomerGroupStatus } from '@common/enums/customer-group-status.enum';
import { CustomerGroupMemberRole } from '@common/enums/customer-group-member-role.enum';

/**
 * Customer-groups repository (DataSource-injected per Rules.md §7). Owns reads +
 * writes for groups and their memberships. Membership-scoped (no branch
 * dimension) — a group is cross-branch by design.
 */
@Injectable()
export class CustomerGroupsRepository {
  private readonly groups: Repository<CustomerGroup>;
  private readonly members: Repository<CustomerGroupMember>;

  constructor(private readonly dataSource: DataSource) {
    this.groups = dataSource.getRepository(CustomerGroup);
    this.members = dataSource.getRepository(CustomerGroupMember);
  }

  createGroup(input: Partial<CustomerGroup>): CustomerGroup {
    return this.groups.create(input);
  }

  saveGroup(entity: CustomerGroup): Promise<CustomerGroup> {
    return this.groups.save(entity);
  }

  findById(id: string): Promise<CustomerGroup | null> {
    return this.groups.findOne({ where: { id } });
  }

  findByJoinCode(joinCode: string): Promise<CustomerGroup | null> {
    return this.groups.findOne({ where: { joinCode } });
  }

  async existsByJoinCode(joinCode: string): Promise<boolean> {
    return (await this.groups.count({ where: { joinCode } })) > 0;
  }

  /**
   * Create a group and its OWNER membership in one transaction so a group never
   * exists without its owner row.
   */
  async createGroupWithOwner(group: CustomerGroup): Promise<CustomerGroup> {
    return this.dataSource.transaction(async (manager) => {
      const saved = await manager.getRepository(CustomerGroup).save(group);
      const memberRepo = manager.getRepository(CustomerGroupMember);
      await memberRepo.save(
        memberRepo.create({
          customerGroupId: saved.id,
          userId: saved.ownerUserId,
          role: CustomerGroupMemberRole.OWNER,
        }),
      );
      return saved;
    });
  }

  createMember(input: Partial<CustomerGroupMember>): CustomerGroupMember {
    return this.members.create(input);
  }

  saveMember(entity: CustomerGroupMember): Promise<CustomerGroupMember> {
    return this.members.save(entity);
  }

  findMembership(
    customerGroupId: string,
    userId: string,
  ): Promise<CustomerGroupMember | null> {
    return this.members.findOne({ where: { customerGroupId, userId } });
  }

  async deleteMember(customerGroupId: string, userId: string): Promise<void> {
    await this.members.delete({ customerGroupId, userId });
  }

  /** Active groups the user belongs to, newest first; `.group` is loaded. */
  listMembershipsForUser(userId: string): Promise<CustomerGroupMember[]> {
    return this.members
      .createQueryBuilder('m')
      .innerJoinAndSelect('m.group', 'g')
      .where('m.user_id = :userId', { userId })
      .andWhere('g.status = :status', { status: CustomerGroupStatus.ACTIVE })
      .orderBy('g.created_at', 'DESC')
      .getMany();
  }

  /** Members of a group, owner first (owner joins at creation); `.user` loaded. */
  listMembers(customerGroupId: string): Promise<CustomerGroupMember[]> {
    return this.members
      .createQueryBuilder('m')
      .innerJoinAndSelect('m.user', 'u')
      .where('m.customer_group_id = :customerGroupId', { customerGroupId })
      .orderBy('m.joined_at', 'ASC')
      .getMany();
  }

  countMembers(customerGroupId: string): Promise<number> {
    return this.members.count({ where: { customerGroupId } });
  }

  /** member count per group id, for the "my groups" list (one grouped query). */
  async memberCountsByGroup(groupIds: string[]): Promise<Map<string, number>> {
    if (groupIds.length === 0) return new Map();
    const rows = await this.members
      .createQueryBuilder('m')
      .select('m.customer_group_id', 'groupId')
      .addSelect('COUNT(*)', 'count')
      .where('m.customer_group_id IN (:...groupIds)', { groupIds })
      .groupBy('m.customer_group_id')
      .getRawMany<{ groupId: string; count: string }>();
    return new Map(rows.map((r) => [r.groupId, Number(r.count)]));
  }
}
