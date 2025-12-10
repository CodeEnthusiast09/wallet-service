import { ApiProperty } from '@nestjs/swagger';
import {
  TransactionType,
  TransactionStatus,
} from '../entities/transaction.entity';

export class TransactionResponseDto {
  @ApiProperty({ enum: TransactionType, example: 'deposit' })
  type: TransactionType;

  @ApiProperty({ example: 5000 })
  amount: number;

  @ApiProperty({ enum: TransactionStatus, example: 'success' })
  status: TransactionStatus;
}
