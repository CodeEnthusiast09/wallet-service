import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from './entities/transaction.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async createTransaction(
    walletId: string,
    type: TransactionType,
    amount: number,
    reference?: string,
    recipientWalletId?: string,
  ): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      walletId,
      type,
      amount,
      reference,
      recipientWalletId,
      status: TransactionStatus.PENDING,
    });

    return await this.transactionRepository.save(transaction);
  }

  async updateTransactionStatus(
    reference: string,
    status: TransactionStatus,
  ): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { reference },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    transaction.status = status;
    return await this.transactionRepository.save(transaction);
  }

  async getTransactionsByWalletId(walletId: string): Promise<Transaction[]> {
    return await this.transactionRepository.find({
      where: { walletId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByReference(reference: string): Promise<Transaction | null> {
    return await this.transactionRepository.findOne({
      where: { reference },
    });
  }
}
