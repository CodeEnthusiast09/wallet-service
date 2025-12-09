import { IsNumber, IsPositive, Min } from 'class-validator';

export class DepositDto {
  @IsNumber()
  @IsPositive({ message: 'Amount must be a positive number' })
  @Min(100, { message: 'Minimum deposit amount is 100' })
  amount: number;
}
