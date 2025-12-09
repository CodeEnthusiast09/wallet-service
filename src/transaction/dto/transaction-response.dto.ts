import {
  TransactionStatus,
  TransactionType,
} from '../entities/transaction.entity';

export class TransactionResponseDto {
  id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  reference?: string;
  recipientWalletId?: string;
  createdAt: Date;
}
