import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchesService } from '@branches/branches.service';
import { BranchesController } from '@branches/branches.controller';
import { BranchesRepository } from '@branches/branches.repository';
import { Branch } from '@branches/entities/branch.entity';
import { BranchPerformanceRepository } from '@branches/branch-performance.repository';

@Module({
  // NOTE: do not import UsersModule here. UsersModule already imports
  // BranchesModule (for UsersService.updateMyBranch), so adding it back would
  // re-create a circular module dependency that crashes Nest's scanner at
  // boot. Cross-module reads for the performance dashboard go through
  // BranchPerformanceRepository (DataSource-injected), not a borrowed repo.
  imports: [TypeOrmModule.forFeature([Branch])],
  controllers: [BranchesController],
  providers: [BranchesService, BranchesRepository, BranchPerformanceRepository],
  exports: [BranchesService, BranchesRepository],
})
export class BranchesModule {}
