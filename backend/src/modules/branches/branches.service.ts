import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './entities/branch.entity.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';

@Injectable()
export class BranchesService {
    constructor(
        @InjectRepository(Branch)
        private readonly branchRepository: Repository<Branch>,
    ) { }

    async create(createBranchDto: CreateBranchDto): Promise<Branch> {
        const branch = this.branchRepository.create(createBranchDto);
        return this.branchRepository.save(branch);
    }

    async findAll(): Promise<Branch[]> {
        return this.branchRepository.find();
    }

    async findById(id: string): Promise<Branch | null> {
        return this.branchRepository.findOne({ where: { id } });
    }

    async remove(id: string): Promise<void> {
        await this.branchRepository.delete(id);
    }
}
