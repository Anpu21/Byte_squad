import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '@pos/entities/transaction.entity.js';
import { CreateTransactionDto } from '@pos/dto/create-transaction.dto.js';

@Injectable()
export class PosService {
    constructor(
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
    ) { }

    async createTransaction(
        dto: CreateTransactionDto,
        cashierId: string,
        branchId: string,
    ): Promise<Transaction> {
        const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        const transaction = this.transactionRepository.create({
            transactionNumber,
            branchId,
            cashierId,
            type: dto.type,
            subtotal: 0,
            discountAmount: dto.discountAmount ?? 0,
            discountType: dto.discountType,
            taxAmount: 0,
            total: 0,
            paymentMethod: dto.paymentMethod,
            items: dto.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discountAmount: item.discountAmount ?? 0,
                discountType: item.discountType,
                lineTotal: item.unitPrice * item.quantity - (item.discountAmount ?? 0),
            })),
        });

        return this.transactionRepository.save(transaction);
    }

    async findAll(branchId: string): Promise<Transaction[]> {
        return this.transactionRepository.find({
            where: { branchId },
            relations: ['items', 'items.product', 'cashier'],
            order: { createdAt: 'DESC' },
        });
    }

    async findById(id: string): Promise<Transaction | null> {
        return this.transactionRepository.findOne({
            where: { id },
            relations: ['items', 'items.product', 'cashier'],
        });
    }
}
