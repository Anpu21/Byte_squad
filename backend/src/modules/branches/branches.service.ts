import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from '@branches/entities/branch.entity';
import { CreateBranchDto } from '@branches/dto/create-branch.dto';

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
