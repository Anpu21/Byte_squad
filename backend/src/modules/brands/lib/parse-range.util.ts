import { BadRequestException } from '@nestjs/common';

/** Parse and sanity-check an ISO date-range query (400 on invalid/inverted). */
export function parseDateRange(query: {
  startDate: string;
  endDate: string;
}): { startDate: Date; endDate: Date } {
  const startDate = new Date(query.startDate);
  const endDate = new Date(query.endDate);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new BadRequestException('Invalid date range');
  }
  if (startDate > endDate) {
    throw new BadRequestException('startDate must be before endDate');
  }
  return { startDate, endDate };
}
