import { ConflictException } from '@nestjs/common';

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Enforce the customer's credit ceiling at checkout. `creditLimit` NULL
 * means unlimited (legacy behavior). Throws 409 when the new running
 * balance would exceed the limit — the message tells the cashier exactly
 * how much credit room is left.
 */
export function assertWithinCreditLimit(
  creditLimit: number | null,
  currentBalance: number,
  creditTaken: number,
): void {
  if (creditLimit === null || creditTaken <= 0) return;
  const newBalance = round2(currentBalance + creditTaken);
  if (newBalance > Number(creditLimit)) {
    const room = Math.max(round2(Number(creditLimit) - currentBalance), 0);
    throw new ConflictException(
      `Credit limit exceeded — limit ${Number(creditLimit).toFixed(2)}, ` +
        `current balance ${currentBalance.toFixed(2)}, available credit ${room.toFixed(2)}`,
    );
  }
}
