import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BulkAttendanceDto } from './bulk-attendance.dto';

const EMP_ID = '33333333-3333-4333-8333-333333333333';

function makeDto(totalHours: unknown): BulkAttendanceDto {
  return plainToInstance(BulkAttendanceDto, {
    rows: [
      {
        employeeId: EMP_ID,
        attendanceDate: '2026-05-24',
        status: 'Present',
        totalHours,
      },
    ],
  });
}

describe('BulkAttendanceDto', () => {
  it('accepts explicit totalHours with up to 2 decimal places', async () => {
    const errors = await validate(makeDto(7.75));

    expect(errors).toHaveLength(0);
  });

  it('rejects totalHours above 24', async () => {
    const errors = await validate(makeDto(24.25));

    expect(errors).not.toHaveLength(0);
  });

  it('rejects totalHours with more than 2 decimal places', async () => {
    const errors = await validate(makeDto(7.125));

    expect(errors).not.toHaveLength(0);
  });
});
