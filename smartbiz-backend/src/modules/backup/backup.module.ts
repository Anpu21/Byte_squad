import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupLog } from '@database/entities/backup-log.entity';
import { BackupService } from './services/backup.service';
import { BackupController } from './controllers/backup.controller';

@Module({
    imports: [TypeOrmModule.forFeature([BackupLog])],
    controllers: [BackupController],
    providers: [BackupService],
    exports: [BackupService],
})
export class BackupModule { }
