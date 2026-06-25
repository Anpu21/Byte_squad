import { Module } from '@nestjs/common';
import { AdminPortalController } from '@admin-portal/admin-portal.controller';
import { AdminPortalService } from '@admin-portal/admin-portal.service';
import { AdminPortalReportsRepository } from '@admin-portal/admin-portal-reports.repository';
import { BranchesModule } from '@branches/branches.module';
import { UsersModule } from '@users/users.module';
import { InventoryCoreModule } from '@/modules/inventory-core/inventory-core.module';

@Module({
  imports: [BranchesModule, UsersModule, InventoryCoreModule],
  controllers: [AdminPortalController],
  providers: [AdminPortalService, AdminPortalReportsRepository],
})
export class AdminPortalModule {}
