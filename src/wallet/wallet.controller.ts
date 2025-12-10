import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { TransactionService } from '../transaction/transaction.service';
import { PaystackService } from '../paystack/paystack.service';
import { TransferDto } from './dto/transfer.dto';
import { BalanceResponseDto } from './dto/balance-response.dto';
import { TransferResponseDto } from './dto/transfer-response.dto';
import { TransactionResponseDto } from '../transaction/dto/transaction-response.dto';
import { DepositDto } from './dto/deposit.dto';
import { DepositResponseDto } from './dto/deposit-response.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { PayloadType } from 'src/interface/payload-types';
import { TransactionType } from '../transaction/entities/transaction.entity';
import { OptionalAuthGuard } from 'src/common/guards/optional-auth.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { ApiKeyPermission } from 'src/api-key/entities/api-key.entity';

@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly transactionService: TransactionService,
    private readonly paystackService: PaystackService,
  ) {}

  @UseGuards(OptionalAuthGuard)
  @RequirePermissions(ApiKeyPermission.READ)
  @Get('balance')
  async getBalance(
    @CurrentUser() user: PayloadType,
  ): Promise<BalanceResponseDto> {
    const wallet = await this.walletService.getWalletByUserId(user.userId);
    return { balance: Number(wallet.balance) };
  }

  @UseGuards(OptionalAuthGuard)
  @RequirePermissions(ApiKeyPermission.DEPOSIT)
  @Post('deposit')
  async deposit(
    @CurrentUser() user: PayloadType,
    @Body() depositDto: DepositDto,
  ): Promise<DepositResponseDto> {
    const wallet = await this.walletService.getWalletByUserId(user.userId);
    const reference = `dep_${Date.now()}_${wallet.id.substring(0, 8)}`;

    await this.transactionService.createTransaction(
      wallet.id,
      TransactionType.DEPOSIT,
      depositDto.amount,
      reference,
    );

    const { authorization_url } =
      await this.paystackService.initializeTransaction(
        user.email,
        depositDto.amount,
        reference,
      );

    return {
      reference,
      authorization_url,
    };
  }

  @UseGuards(OptionalAuthGuard)
  @RequirePermissions(ApiKeyPermission.TRANSFER)
  @Post('transfer')
  async transfer(
    @CurrentUser() user: PayloadType,
    @Body() transferDto: TransferDto,
  ): Promise<TransferResponseDto> {
    return await this.walletService.transfer(
      user.userId,
      transferDto.wallet_number,
      transferDto.amount,
    );
  }

  @UseGuards(OptionalAuthGuard)
  @RequirePermissions(ApiKeyPermission.READ)
  @Get('transactions')
  async getTransactions(
    @CurrentUser() user: PayloadType,
  ): Promise<TransactionResponseDto[]> {
    const wallet = await this.walletService.getWalletByUserId(user.userId);
    const transactions =
      await this.transactionService.getTransactionsByWalletId(wallet.id);

    return transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      status: t.status,
      reference: t.reference,
      recipientWalletId: t.recipientWalletId,
      createdAt: t.createdAt,
    }));
  }

  @Get('deposit/:reference/status')
  async getDepositStatus(@Param('reference') reference: string) {
    const transaction =
      await this.transactionService.findByReference(reference);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      reference: transaction.reference,
      status: transaction.status,
      amount: Number(transaction.amount),
    };
  }
}
