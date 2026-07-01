import { BadRequestException } from '@nestjs/common';
import { MultiTenderCalculatorService } from './multi-tender-calculator.service';
import type { CreateSalePaymentDto } from '@pos/dto/create-sale.dto';

/**
 * Type-safe builder for the spec payload so we don't have to cast `as any`
 * inside every test (matches the Shanel-shape contract).
 */
function payment(
  overrides: Partial<CreateSalePaymentDto>,
): CreateSalePaymentDto {
  return {
    paymentMethod: 'Cash',
    paymentAmount: 0,
    ...overrides,
  } as CreateSalePaymentDto;
}

describe('MultiTenderCalculatorService', () => {
  const svc = new MultiTenderCalculatorService();

  it('full cash payment: Paid, no balance, no change', () => {
    // Arrange
    const total = 100;
    const dto = payment({
      paymentMethod: 'Cash',
      paymentAmount: 100,
      cashAmount: 100,
      cashTendered: 100,
    });

    // Act
    const result = svc.calculate(total, dto);

    // Assert
    expect(result.paymentStatus).toBe('Paid');
    expect(result.balanceDue).toBe(0);
    expect(result.cashChange).toBe(0);
    expect(result.paymentAmount).toBe(100);
    expect(result.paidAmount).toBe(100);
    expect(result.creditTaken).toBe(0);
    expect(result.overpayKeptBalance).toBe(0);
  });

  it('cash with overpay tender returns change', () => {
    // Arrange
    const total = 100;
    const dto = payment({
      paymentMethod: 'Cash',
      paymentAmount: 100,
      cashAmount: 100,
      cashTendered: 150,
    });

    // Act
    const result = svc.calculate(total, dto);

    // Assert
    expect(result.cashChange).toBe(50);
    expect(result.paymentStatus).toBe('Paid');
    expect(result.paymentAmount).toBe(100);
  });

  it('split cash + cheque: Paid, no balance, paymentAmount=sum', () => {
    // Arrange
    const total = 100;
    const dto = payment({
      paymentMethod: 'Cash',
      paymentAmount: 100,
      cashAmount: 60,
      chequeAmount: 40,
      cashTendered: 60,
    });

    // Act
    const result = svc.calculate(total, dto);

    // Assert
    expect(result.paymentStatus).toBe('Paid');
    expect(result.paymentAmount).toBe(100);
    expect(result.balanceDue).toBe(0);
    expect(result.cashChange).toBe(0);
  });

  it('partial cash: Partially_Paid with balanceDue', () => {
    // Arrange
    const total = 100;
    const dto = payment({
      paymentMethod: 'Cash',
      paymentAmount: 70,
      cashAmount: 70,
      cashTendered: 70,
    });

    // Act
    const result = svc.calculate(total, dto);

    // Assert
    expect(result.paymentStatus).toBe('Partially_Paid');
    expect(result.balanceDue).toBe(30);
    expect(result.paidAmount).toBe(70);
    expect(result.paymentAmount).toBe(70);
  });

  it('full credit: counted as Paid; creditTaken records the AR', () => {
    // Arrange
    const total = 100;
    const dto = payment({
      paymentMethod: 'Credit',
      paymentAmount: 100,
      creditAmount: 100,
    });

    // Act
    const result = svc.calculate(total, dto);

    // Assert
    expect(result.paymentStatus).toBe('Paid');
    expect(result.creditTaken).toBe(100);
    expect(result.balanceDue).toBe(0);
    expect(result.paidAmount).toBe(100);
  });

  it('keep-balance overpayment: kept as customer credit, paidAmount capped at invoice', () => {
    // Arrange
    const total = 100;
    const dto = payment({
      paymentMethod: 'Cash',
      paymentAmount: 120,
      cashAmount: 120,
      cashTendered: 120,
      keepBalance: true,
    });

    // Act
    const result = svc.calculate(total, dto);

    // Assert
    expect(result.overpayKeptBalance).toBe(20);
    expect(result.paidAmount).toBe(100);
    expect(result.paymentStatus).toBe('Paid');
    expect(result.balanceDue).toBe(0);
  });

  it('overpay without keep-balance flag throws BadRequestException', () => {
    // Arrange
    const total = 100;
    const dto = payment({
      paymentMethod: 'Cash',
      paymentAmount: 120,
      cashAmount: 120,
      cashTendered: 120,
    });

    // Act + Assert
    expect(() => svc.calculate(total, dto)).toThrow(BadRequestException);
    expect(() => svc.calculate(total, dto)).toThrow(
      'Overpayment requires keepBalance=true',
    );
  });

  it('omitting loyaltyAmount keeps loyaltyApplied at 0', () => {
    const result = svc.calculate(
      100,
      payment({ cashAmount: 100, cashTendered: 100 }),
    );

    expect(result.loyaltyApplied).toBe(0);
    expect(result.paymentAmount).toBe(100);
  });

  it('loyalty tender + cash: Paid; money owed drops by the redeem value', () => {
    // Rs1000 bill, 200 settled by points → cashier only collects Rs800.
    const result = svc.calculate(
      1000,
      payment({ cashAmount: 800, cashTendered: 800 }),
      200,
    );

    expect(result.paymentStatus).toBe('Paid');
    expect(result.balanceDue).toBe(0);
    expect(result.paymentAmount).toBe(800); // money only
    expect(result.loyaltyApplied).toBe(200);
    expect(result.paidAmount).toBe(1000); // fully settled (money + points)
    expect(result.cashChange).toBe(0);
  });

  it('loyalty tender covering the whole bill: Paid with zero cash', () => {
    const result = svc.calculate(
      1000,
      payment({ cashAmount: 0, cashTendered: 0 }),
      1000,
    );

    expect(result.paymentStatus).toBe('Paid');
    expect(result.paymentAmount).toBe(0);
    expect(result.loyaltyApplied).toBe(1000);
    expect(result.paidAmount).toBe(1000);
    expect(result.balanceDue).toBe(0);
  });

  it('loyalty tender + partial cash: Partially_Paid, balanceDue nets points', () => {
    const result = svc.calculate(
      1000,
      payment({ cashAmount: 500, cashTendered: 500 }),
      200,
    );

    expect(result.paymentStatus).toBe('Partially_Paid');
    expect(result.balanceDue).toBe(300); // 1000 - (500 + 200)
    expect(result.paidAmount).toBe(700);
    expect(result.paymentAmount).toBe(500);
    expect(result.loyaltyApplied).toBe(200);
  });

  it('money overpay alongside loyalty kept as credit when keepBalance set', () => {
    const result = svc.calculate(
      1000,
      payment({ cashAmount: 900, cashTendered: 900, keepBalance: true }),
      200,
    );

    expect(result.overpayKeptBalance).toBe(100); // 1100 settled - 1000
    expect(result.paidAmount).toBe(1000);
    expect(result.paymentStatus).toBe('Paid');
  });

  it('money overpay alongside loyalty throws without keepBalance', () => {
    expect(() =>
      svc.calculate(1000, payment({ cashAmount: 900, cashTendered: 900 }), 200),
    ).toThrow(BadRequestException);
  });
});
