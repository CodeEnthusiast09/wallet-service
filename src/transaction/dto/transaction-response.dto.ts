import {
  TransactionStatus,
  TransactionType,
} from '../entities/transaction.entity';

export class TransactionResponseDto {
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
}
