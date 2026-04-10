import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from '@branches/entities/branch.entity';
import { CreateBranchDto } from '@branches/dto/create-branch.dto';
import { UpdateBranchDto } from '@branches/dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}

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

  async update(id: string, dto: UpdateBranchDto): Promise<Branch> {
    const branch = await this.branchRepository.findOne({ where: { id } });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    await this.branchRepository.update(id, dto);
    const updated = await this.branchRepository.findOne({ where: { id } });
    if (!updated) {
      throw new NotFoundException('Branch not found');
    }
    return updated;
  }

  async toggleActive(id: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({ where: { id } });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    branch.isActive = !branch.isActive;
    return this.branchRepository.save(branch);
  }

  async remove(id: string): Promise<void> {
    const branch = await this.branchRepository.findOne({ where: { id } });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    await this.branchRepository.delete(id);
  }
}
