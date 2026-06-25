import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosShift } from '@/modules/pos-shifts/entities/pos-shift.entity';
import { ShiftsController } from '@/modules/pos-shifts/shifts.controller';
import { ShiftsService } from '@/modules/pos-shifts/shifts.service';
import { ShiftsRepository } from '@/modules/pos-shifts/shifts.repository';

/**
 * Cashier shifts — open/close drawer sessions and the live shift summary.
 * Self-contained leaf: owns the pos_shift table and depends on no other module.
 */
@Module({
  imports: [TypeOrmModule.forFeature([PosShift])],
  controllers: [ShiftsController],
  providers: [ShiftsRepository, ShiftsService],
  exports: [],
})
export class PosShiftsModule {}
