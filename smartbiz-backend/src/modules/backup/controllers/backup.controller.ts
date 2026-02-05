import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { BackupService } from '../services/backup.service';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Role } from '@common/constants/roles.enum';
import { BackupType } from '@database/entities/backup-log.entity';

@Controller('backup')
@UseGuards(RolesGuard)
export class BackupController {
    constructor(private readonly backupService: BackupService) { }

    @Post('create')
    @Roles(Role.ADMIN)
    async createBackup(
        @CurrentUser('companyId') companyId: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.backupService.createBackup(companyId, userId, BackupType.MANUAL);
    }

    @Post('restore/:id')
    @Roles(Role.ADMIN)
    async restoreBackup(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.backupService.restoreBackup(id, userId);
    }

    @Get('history')
    @Roles(Role.ADMIN)
    async getBackupHistory(@CurrentUser('companyId') companyId: string) {
        return this.backupService.getBackupHistory(companyId);
    }
}
