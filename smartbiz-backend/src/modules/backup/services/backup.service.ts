import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BackupLog, BackupStatus, BackupType } from '@database/entities/backup-log.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class BackupService {
    private readonly encryptionAlgorithm = 'aes-256-gcm';
    private readonly backupDir: string;

    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(BackupLog)
        private readonly backupLogRepository: Repository<BackupLog>,
    ) {
        this.backupDir = path.join(process.cwd(), 'backups');
        this.ensureBackupDirectory();
    }

    private ensureBackupDirectory(): void {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    async createBackup(
        companyId: string,
        userId: string,
        type: BackupType = BackupType.MANUAL,
    ): Promise<BackupLog> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `backup-${companyId}-${timestamp}.enc`;
        const filePath = path.join(this.backupDir, fileName);

        // Create backup log entry
        const backupLog = this.backupLogRepository.create({
            companyId,
            backupType: type,
            status: BackupStatus.IN_PROGRESS,
            fileName,
            filePath,
            createdBy: userId,
        });

        await this.backupLogRepository.save(backupLog);

        try {
            // Read SQLite database file
            const dbPath = this.configService.get<string>('database.sqlite.database');
            const dbContent = fs.readFileSync(dbPath);

            // Encrypt the database
            const encryptedData = this.encryptData(dbContent);

            // Write encrypted backup
            fs.writeFileSync(filePath, encryptedData);

            // Calculate checksum
            const checksum = crypto
                .createHash('sha256')
                .update(encryptedData)
                .digest('hex');

            // Update backup log
            backupLog.status = BackupStatus.SUCCESS;
            backupLog.fileSize = encryptedData.length;
            backupLog.checksum = checksum;
            backupLog.completedAt = new Date();

            return this.backupLogRepository.save(backupLog);
        } catch (error) {
            backupLog.status = BackupStatus.FAILED;
            backupLog.errorMessage = error.message;
            backupLog.completedAt = new Date();
            await this.backupLogRepository.save(backupLog);
            throw new BadRequestException(`Backup failed: ${error.message}`);
        }
    }

    async restoreBackup(
        backupId: string,
        userId: string,
    ): Promise<{ success: boolean; message: string }> {
        const backupLog = await this.backupLogRepository.findOne({
            where: { id: backupId },
        });

        if (!backupLog) {
            throw new BadRequestException('Backup not found');
        }

        if (!fs.existsSync(backupLog.filePath)) {
            throw new BadRequestException('Backup file not found on disk');
        }

        try {
            // Read encrypted backup
            const encryptedData = fs.readFileSync(backupLog.filePath);

            // Verify checksum
            const checksum = crypto
                .createHash('sha256')
                .update(encryptedData)
                .digest('hex');

            if (checksum !== backupLog.checksum) {
                throw new BadRequestException('Backup file is corrupted');
            }

            // Decrypt the data
            const decryptedData = this.decryptData(encryptedData);

            // Backup current database before restore
            const dbPath = this.configService.get<string>('database.sqlite.database');
            const backupBeforeRestore = `${dbPath}.pre-restore`;

            if (fs.existsSync(dbPath)) {
                fs.copyFileSync(dbPath, backupBeforeRestore);
            }

            // Write restored database
            fs.writeFileSync(dbPath, decryptedData);

            return {
                success: true,
                message: `Database restored from backup ${backupLog.fileName}`,
            };
        } catch (error) {
            throw new BadRequestException(`Restore failed: ${error.message}`);
        }
    }

    async getBackupHistory(companyId: string): Promise<BackupLog[]> {
        return this.backupLogRepository.find({
            where: { companyId },
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }

    private encryptData(data: Buffer): Buffer {
        const key = this.getEncryptionKey();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.encryptionAlgorithm, key, iv);

        const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
        const authTag = cipher.getAuthTag();

        // Format: IV (16 bytes) + AuthTag (16 bytes) + Encrypted Data
        return Buffer.concat([iv, authTag, encrypted]);
    }

    private decryptData(encryptedData: Buffer): Buffer {
        const key = this.getEncryptionKey();

        const iv = encryptedData.subarray(0, 16);
        const authTag = encryptedData.subarray(16, 32);
        const encrypted = encryptedData.subarray(32);

        const decipher = crypto.createDecipheriv(this.encryptionAlgorithm, key, iv);
        decipher.setAuthTag(authTag);

        return Buffer.concat([decipher.update(encrypted), decipher.final()]);
    }

    private getEncryptionKey(): Buffer {
        const keyString = this.configService.get<string>('app.encryption.backupKey');
        // Ensure key is exactly 32 bytes for AES-256
        return crypto.createHash('sha256').update(keyString).digest();
    }
}
