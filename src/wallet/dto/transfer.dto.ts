import { IsString, IsNumber, IsPositive, Length, Min } from 'class-validator';

export class TransferDto {
  @IsString()
  @Length(13, 13, { message: 'Wallet number must be exactly 13 digits' })
  wallet_number: string;

  @IsNumber()
  @IsPositive({ message: 'Amount must be a positive number' })
  @Min(100, { message: 'Minimum transfer amount is 100' })
  amount: number;
}
