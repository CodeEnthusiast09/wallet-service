import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { TransactionService } from '../transaction/transaction.service';
import {
  TransactionType,
  TransactionStatus,
  Transaction,
} from '../transaction/entities/transaction.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    private transactionService: TransactionService,
    private dataSource: DataSource,
  ) {}

  async createWallet(userId: string): Promise<Wallet> {
    const walletNumber = this.generateWalletNumber();

    const wallet = this.walletRepository.create({
      userId,
      walletNumber,
      balance: 0,
    });

    return await this.walletRepository.save(wallet);
  }

  async getWalletByUserId(userId: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async getWalletByNumber(walletNumber: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { walletNumber },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async creditWallet(
    reference: string,
    amount: number,
    paystackStatus: string,
  ): Promise<void> {
    const transaction =
      await this.transactionService.findByReference(reference);

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    if (transaction.status === TransactionStatus.SUCCESS) {
      return;
    }

    const wallet = await this.walletRepository.findOne({
      where: { id: transaction.walletId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (paystackStatus === 'success') {
      wallet.balance = Number(wallet.balance) + Number(amount);
      await this.walletRepository.save(wallet);

      await this.transactionService.updateTransactionStatus(
        reference,
        TransactionStatus.SUCCESS,
      );
    } else {
      await this.transactionService.updateTransactionStatus(
        reference,
        TransactionStatus.FAILED,
      );
    }
  }

  async transfer(
    senderUserId: string,
    recipientWalletNumber: string,
    amount: number,
  ): Promise<{ status: string; message: string; transactionId: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const senderWallet = await queryRunner.manager.findOne(Wallet, {
        where: { userId: senderUserId },
      });

      if (!senderWallet) {
        throw new NotFoundException('Sender wallet not found');
      }

      if (Number(senderWallet.balance) < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      const recipientWallet = await queryRunner.manager.findOne(Wallet, {
        where: { walletNumber: recipientWalletNumber },
      });

      if (!recipientWallet) {
        throw new NotFoundException('Recipient wallet not found');
      }

      if (senderWallet.id === recipientWallet.id) {
        throw new BadRequestException('Cannot transfer to your own wallet');
      }

      // Deduct from sender
      senderWallet.balance = Number(senderWallet.balance) - amount;
      await queryRunner.manager.save(senderWallet);

      // Credit recipient
      recipientWallet.balance = Number(recipientWallet.balance) + amount;
      await queryRunner.manager.save(recipientWallet);

      // Create transaction record
      const transactionData = queryRunner.manager.create(Transaction, {
        walletId: senderWallet.id,
        type: TransactionType.TRANSFER,
        amount,
        recipientWalletId: recipientWallet.id,
        status: TransactionStatus.SUCCESS,
      });

      const transaction = await queryRunner.manager.save(
        Transaction,
        transactionData,
      );

      await queryRunner.commitTransaction();

      return {
        status: 'success',
        message: 'Transfer completed',
        transactionId: transaction.id,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private generateWalletNumber(): string {
    return Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
  }
}
