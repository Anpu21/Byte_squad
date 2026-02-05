import { Test, TestingModule } from '@nestjs/testing';
import { AccountingEngineService } from '../../src/modules/vouchers/services/accounting-engine.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Voucher } from '../../src/modules/vouchers/entities/voucher.entity';
import { VoucherEntry } from '../../src/modules/vouchers/entities/voucher-entry.entity';
import { Ledger } from '../../src/modules/ledgers/entities/ledger.entity';
import { VoucherType, LedgerGroupType, BalanceType } from '../../src/common/constants/accounting.enum';
import { BadRequestException } from '@nestjs/common';

describe('AccountingEngineService', () => {
    let service: AccountingEngineService;
    let voucherRepository: Repository<Voucher>;
    let entryRepository: Repository<VoucherEntry>;
    let ledgerRepository: Repository<Ledger>;
    let dataSource: DataSource;

    const mockTransactionManager = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
    };

    const mockDataSource = {
        transaction: jest.fn((callback) => callback(mockTransactionManager)),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AccountingEngineService,
                {
                    provide: DataSource,
                    useValue: mockDataSource,
                },
                {
                    provide: getRepositoryToken(Voucher),
                    useValue: {
                        create: jest.fn(),
                        save: jest.fn(),
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(VoucherEntry),
                    useValue: {
                        create: jest.fn(),
                        save: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Ledger),
                    useValue: {
                        findOne: jest.fn(),
                        update: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<AccountingEngineService>(AccountingEngineService);
        voucherRepository = module.get(getRepositoryToken(Voucher));
        entryRepository = module.get(getRepositoryToken(VoucherEntry));
        ledgerRepository = module.get(getRepositoryToken(Ledger));
        dataSource = module.get(DataSource);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Double-Entry Validation', () => {
        it('should reject voucher when debit does not equal credit', async () => {
            const dto = {
                voucherType: VoucherType.JOURNAL,
                voucherDate: '2026-01-15',
                companyId: 'company-123',
                entries: [
                    { ledgerId: 'ledger-1', debitAmount: 1000, creditAmount: 0 },
                    { ledgerId: 'ledger-2', debitAmount: 0, creditAmount: 500 },
                ],
            };

            await expect(service.createVoucher(dto, 'user-123')).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should reject voucher with zero amounts', async () => {
            const dto = {
                voucherType: VoucherType.JOURNAL,
                voucherDate: '2026-01-15',
                companyId: 'company-123',
                entries: [
                    { ledgerId: 'ledger-1', debitAmount: 0, creditAmount: 0 },
                    { ledgerId: 'ledger-2', debitAmount: 0, creditAmount: 0 },
                ],
            };

            await expect(service.createVoucher(dto, 'user-123')).rejects.toThrow(
                'Voucher must have at least one entry with an amount',
            );
        });

        it('should accept voucher when debit equals credit', async () => {
            const dto = {
                voucherType: VoucherType.JOURNAL,
                voucherDate: '2026-01-15',
                companyId: 'company-123',
                entries: [
                    { ledgerId: 'ledger-1', debitAmount: 1000, creditAmount: 0 },
                    { ledgerId: 'ledger-2', debitAmount: 0, creditAmount: 1000 },
                ],
            };

            const mockVoucher = { id: 'voucher-123', ...dto };
            mockTransactionManager.create.mockReturnValue(mockVoucher);
            mockTransactionManager.save.mockResolvedValue(mockVoucher);

            const result = await service.createVoucher(dto, 'user-123');
            expect(result).toBeDefined();
        });

        it('should handle floating point precision correctly', async () => {
            const dto = {
                voucherType: VoucherType.JOURNAL,
                voucherDate: '2026-01-15',
                companyId: 'company-123',
                entries: [
                    { ledgerId: 'ledger-1', debitAmount: 100.33, creditAmount: 0 },
                    { ledgerId: 'ledger-2', debitAmount: 200.67, creditAmount: 0 },
                    { ledgerId: 'ledger-3', debitAmount: 0, creditAmount: 301.00 },
                ],
            };

            const mockVoucher = { id: 'voucher-123', ...dto };
            mockTransactionManager.create.mockReturnValue(mockVoucher);
            mockTransactionManager.save.mockResolvedValue(mockVoucher);

            const result = await service.createVoucher(dto, 'user-123');
            expect(result).toBeDefined();
        });
    });

    describe('Voucher Posting', () => {
        it('should reject posting an already posted voucher', async () => {
            const postedVoucher = {
                id: 'voucher-123',
                isPosted: true,
                isVoided: false,
                entries: [],
            };

            mockTransactionManager.findOne.mockResolvedValue(postedVoucher);

            await expect(service.postVoucher('voucher-123')).rejects.toThrow(
                'Voucher is already posted',
            );
        });

        it('should reject posting a voided voucher', async () => {
            const voidedVoucher = {
                id: 'voucher-123',
                isPosted: false,
                isVoided: true,
                entries: [],
            };

            mockTransactionManager.findOne.mockResolvedValue(voidedVoucher);

            await expect(service.postVoucher('voucher-123')).rejects.toThrow(
                'Cannot post a voided voucher',
            );
        });
    });

    describe('Voucher Voiding', () => {
        it('should reject voiding an already voided voucher', async () => {
            const voidedVoucher = {
                id: 'voucher-123',
                isVoided: true,
                entries: [],
            };

            mockTransactionManager.findOne.mockResolvedValue(voidedVoucher);

            await expect(
                service.voidVoucher('voucher-123', 'Test reason'),
            ).rejects.toThrow('Voucher is already voided');
        });
    });
});
