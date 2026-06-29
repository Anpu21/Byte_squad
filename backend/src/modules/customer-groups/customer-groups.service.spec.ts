import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CustomerGroupsService } from '@/modules/customer-groups/customer-groups.service';
import { CustomerGroupsRepository } from '@/modules/customer-groups/customer-groups.repository';
import { RealtimePublisher } from '@common/realtime/realtime-publisher.service';
import { CustomerGroup } from '@/modules/customer-groups/entities/customer-group.entity';
import { CustomerGroupMember } from '@/modules/customer-groups/entities/customer-group-member.entity';
import { CustomerGroupStatus } from '@common/enums/customer-group-status.enum';
import { CustomerGroupMemberRole } from '@common/enums/customer-group-member-role.enum';
import { UserRole } from '@common/enums/user-roles.enums';
import type { AuthUser } from '@common/types/auth-user.type';

const OWNER = CustomerGroupMemberRole.OWNER;
const MEMBER = CustomerGroupMemberRole.MEMBER;

const owner: AuthUser = {
  id: 'u-owner',
  email: 'owner@x.com',
  role: UserRole.CUSTOMER,
  branchId: null,
};
const member: AuthUser = {
  id: 'u-member',
  email: 'member@x.com',
  role: UserRole.CUSTOMER,
  branchId: null,
};

function group(over: Partial<CustomerGroup> = {}): CustomerGroup {
  return {
    id: 'g1',
    name: 'Smith Family',
    joinCode: 'FAM-ABCD2345',
    ownerUserId: 'u-owner',
    status: CustomerGroupStatus.ACTIVE,
    createdAt: new Date('2026-06-01'),
    updatedAt: new Date('2026-06-01'),
    ...over,
  } as unknown as CustomerGroup;
}

function membership(
  role: CustomerGroupMemberRole,
  userId: string,
): CustomerGroupMember {
  return {
    id: `mem-${userId}`,
    customerGroupId: 'g1',
    userId,
    role,
    joinedAt: new Date('2026-06-01'),
  } as unknown as CustomerGroupMember;
}

function memberWithUser(
  role: CustomerGroupMemberRole,
  userId: string,
): CustomerGroupMember {
  return {
    ...membership(role, userId),
    user: { firstName: 'Asha', lastName: 'Perera', email: `${userId}@x.com` },
  } as unknown as CustomerGroupMember;
}

describe('CustomerGroupsService', () => {
  let service: CustomerGroupsService;
  let repo: {
    createGroup: jest.Mock;
    createGroupWithOwner: jest.Mock;
    saveGroup: jest.Mock;
    findById: jest.Mock;
    findByJoinCode: jest.Mock;
    existsByJoinCode: jest.Mock;
    createMember: jest.Mock;
    saveMember: jest.Mock;
    deleteMember: jest.Mock;
    findMembership: jest.Mock;
    listMembershipsForUser: jest.Mock;
    listMembers: jest.Mock;
    countMembers: jest.Mock;
    memberCountsByGroup: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      createGroup: jest.fn((x: Partial<CustomerGroup>) => x as CustomerGroup),
      createGroupWithOwner: jest.fn((g: CustomerGroup) =>
        Promise.resolve({ ...g, id: 'g1' }),
      ),
      saveGroup: jest.fn((g: CustomerGroup) => Promise.resolve(g)),
      findById: jest.fn().mockResolvedValue(group()),
      findByJoinCode: jest.fn(),
      existsByJoinCode: jest.fn().mockResolvedValue(false),
      createMember: jest.fn((x: Partial<CustomerGroupMember>) => x),
      saveMember: jest.fn((m: CustomerGroupMember) => Promise.resolve(m)),
      deleteMember: jest.fn().mockResolvedValue(undefined),
      findMembership: jest.fn().mockResolvedValue(membership(OWNER, 'u-owner')),
      listMembershipsForUser: jest.fn().mockResolvedValue([]),
      listMembers: jest
        .fn()
        .mockResolvedValue([memberWithUser(OWNER, 'u-owner')]),
      countMembers: jest.fn().mockResolvedValue(1),
      memberCountsByGroup: jest.fn().mockResolvedValue(new Map([['g1', 1]])),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        CustomerGroupsService,
        { provide: CustomerGroupsRepository, useValue: repo },
        { provide: RealtimePublisher, useValue: { revokeGroupChat: jest.fn() } },
      ],
    }).compile();
    service = moduleRef.get(CustomerGroupsService);
  });

  describe('create', () => {
    it('trims the name, generates a FAM- join code, owns the group', async () => {
      const res = await service.create({ name: '  Smith Family ' }, owner);
      expect(repo.createGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Smith Family',
          ownerUserId: 'u-owner',
          status: CustomerGroupStatus.ACTIVE,
        }),
      );
      const createCalls = repo.createGroup.mock.calls as [
        Partial<CustomerGroup>,
      ][];
      expect(createCalls[0][0].joinCode).toMatch(/^FAM-[A-Z0-9]{8}$/);
      expect(repo.createGroupWithOwner).toHaveBeenCalled();
      expect(res.myRole).toBe(OWNER);
      expect(res.members).toHaveLength(1);
    });

    it('rejects a blank name', async () => {
      await expect(service.create({ name: '   ' }, owner)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('join', () => {
    it('adds a MEMBER membership when joining by an active code', async () => {
      repo.findByJoinCode.mockResolvedValue(group());
      repo.findMembership
        .mockResolvedValueOnce(null) // existing-membership check
        .mockResolvedValueOnce(membership(MEMBER, 'u-member')); // getById
      repo.listMembers.mockResolvedValue([
        memberWithUser(OWNER, 'u-owner'),
        memberWithUser(MEMBER, 'u-member'),
      ]);
      const res = await service.join({ joinCode: 'fam-abcd2345' }, member);
      expect(repo.saveMember).toHaveBeenCalled();
      expect(repo.createMember).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u-member', role: MEMBER }),
      );
      expect(res.myRole).toBe(MEMBER);
    });

    it('is idempotent — joining twice does not add a second membership', async () => {
      repo.findByJoinCode.mockResolvedValue(group());
      repo.findMembership.mockResolvedValue(membership(MEMBER, 'u-member'));
      await service.join({ joinCode: 'FAM-ABCD2345' }, member);
      expect(repo.saveMember).not.toHaveBeenCalled();
    });

    it('rejects an unknown code', async () => {
      repo.findByJoinCode.mockResolvedValue(null);
      await expect(
        service.join({ joinCode: 'FAM-NOPE' }, member),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects joining an archived group', async () => {
      repo.findByJoinCode.mockResolvedValue(
        group({ status: CustomerGroupStatus.ARCHIVED }),
      );
      await expect(
        service.join({ joinCode: 'FAM-ABCD2345' }, member),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getById', () => {
    it('rejects a non-member', async () => {
      repo.findMembership.mockResolvedValue(null);
      await expect(service.getById('g1', 'u-stranger')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('leave', () => {
    it('blocks the owner from leaving', async () => {
      repo.findMembership.mockResolvedValue(membership(OWNER, 'u-owner'));
      await expect(service.leave('g1', owner)).rejects.toThrow(
        BadRequestException,
      );
      expect(repo.deleteMember).not.toHaveBeenCalled();
    });

    it('lets a member leave', async () => {
      repo.findMembership.mockResolvedValue(membership(MEMBER, 'u-member'));
      await service.leave('g1', member);
      expect(repo.deleteMember).toHaveBeenCalledWith('g1', 'u-member');
    });
  });

  describe('removeMember', () => {
    it('rejects a non-owner caller', async () => {
      repo.findMembership.mockResolvedValue(membership(MEMBER, 'u-member'));
      await expect(service.removeMember('g1', 'u-x', member)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('blocks the owner removing themselves', async () => {
      repo.findMembership.mockResolvedValue(membership(OWNER, 'u-owner'));
      await expect(
        service.removeMember('g1', 'u-owner', owner),
      ).rejects.toThrow(BadRequestException);
    });

    it('404s when the target is not a member', async () => {
      repo.findMembership
        .mockResolvedValueOnce(membership(OWNER, 'u-owner')) // assertOwner
        .mockResolvedValueOnce(null); // target lookup
      await expect(service.removeMember('g1', 'u-x', owner)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('removes a member when requested by the owner', async () => {
      repo.findMembership
        .mockResolvedValueOnce(membership(OWNER, 'u-owner')) // assertOwner
        .mockResolvedValueOnce(membership(MEMBER, 'u-x')) // target lookup
        .mockResolvedValueOnce(membership(OWNER, 'u-owner')); // getById
      await service.removeMember('g1', 'u-x', owner);
      expect(repo.deleteMember).toHaveBeenCalledWith('g1', 'u-x');
    });
  });

  describe('update', () => {
    it('rejects a non-owner', async () => {
      repo.findMembership.mockResolvedValue(membership(MEMBER, 'u-member'));
      await expect(service.update('g1', { name: 'X' }, member)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('renames the group for the owner (trimmed)', async () => {
      repo.findMembership.mockResolvedValue(membership(OWNER, 'u-owner'));
      await service.update('g1', { name: '  New Name ' }, owner);
      expect(repo.saveGroup).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Name' }),
      );
    });
  });

  describe('regenerateCode', () => {
    it('issues a fresh FAM- code for the owner', async () => {
      repo.findMembership.mockResolvedValue(membership(OWNER, 'u-owner'));
      await service.regenerateCode('g1', owner);
      const saveCalls = repo.saveGroup.mock.calls as [CustomerGroup][];
      expect(saveCalls[0][0].joinCode).toMatch(/^FAM-[A-Z0-9]{8}$/);
    });
  });
});
