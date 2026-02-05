import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserRepository {
    constructor(
        @InjectRepository(User)
        private readonly repository: Repository<User>,
    ) { }

    async findAll(): Promise<User[]> {
        return this.repository.find({
            relations: ['role', 'company'],
            order: { createdAt: 'DESC' },
        });
    }

    async findById(id: string): Promise<User | null> {
        return this.repository.findOne({
            where: { id },
            relations: ['role', 'company'],
        });
    }

    async findByUsername(username: string): Promise<User | null> {
        return this.repository.findOne({
            where: { username },
            relations: ['role', 'company'],
        });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.repository.findOne({
            where: { email },
            relations: ['role', 'company'],
        });
    }

    async findByCompany(companyId: string): Promise<User[]> {
        return this.repository.find({
            where: { companyId },
            relations: ['role'],
            order: { createdAt: 'DESC' },
        });
    }

    async create(userData: Partial<User>): Promise<User> {
        const user = this.repository.create(userData);
        return this.repository.save(user);
    }

    async update(id: string, userData: Partial<User>): Promise<User | null> {
        await this.repository.update(id, userData);
        return this.findById(id);
    }

    async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
        await this.repository.update(id, { refreshToken });
    }

    async updateLastLogin(id: string): Promise<void> {
        await this.repository.update(id, { lastLoginAt: new Date() });
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.repository.delete(id);
        return result.affected > 0;
    }

    async softDelete(id: string): Promise<boolean> {
        const result = await this.repository.update(id, { isActive: false });
        return result.affected > 0;
    }

    async existsByUsername(username: string): Promise<boolean> {
        const count = await this.repository.count({ where: { username } });
        return count > 0;
    }

    async existsByEmail(email: string): Promise<boolean> {
        const count = await this.repository.count({ where: { email } });
        return count > 0;
    }
}
