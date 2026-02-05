import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company, Branch } from './entities';

@Module({
    imports: [TypeOrmModule.forFeature([Company, Branch])],
    exports: [TypeOrmModule],
})
export class CompaniesModule { }
