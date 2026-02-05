import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Role as RoleEnum, RolePermissions } from '@common/constants/roles.enum';

@Injectable()
export class RoleRepository {
    constructor(
        @InjectRepository(Role)
        private readonly repository: Repository<Role>,
    ) { }

    async findAll(): Promise<Role[]> {
        return this.repository.find({ order: { name: 'ASC' } });
    }

    async findById(id: string): Promise<Role | null> {
        return this.repository.findOne({ where: { id } });
    }

    async findByName(name: RoleEnum): Promise<Role | null> {
        return this.repository.findOne({ where: { name } });
    }

    async create(roleData: Partial<Role>): Promise<Role> {
        const role = this.repository.create(roleData);
        return this.repository.save(role);
    }

    async seedDefaultRoles(): Promise<void> {
        const roles = Object.values(RoleEnum);

        for (const roleName of roles) {
            const exists = await this.findByName(roleName);
            if (!exists) {
                await this.create({
                    name: roleName,
                    description: `${roleName} role`,
                    permissions: JSON.stringify(RolePermissions[roleName]),
                });
            }
        }
    }
}
