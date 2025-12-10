import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from '../transaction/entities/transaction.entity';
import { TransactionService } from '../transaction/transaction.service';
import { PaystackModule } from 'src/paystack/paystack.module';
import { ApiKeyModule } from 'src/api-key/api-key.module';
import { AuthModule } from 'src/auth/auth.module';
import { OptionalAuthGuard } from 'src/common/guards/optional-auth.guard';
import { ApiKeyGuard } from 'src/common/guards/api-key.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, Transaction]),
    forwardRef(() => PaystackModule),
    ApiKeyModule,
    AuthModule,
  ],
  providers: [
    WalletService,
    TransactionService,
    OptionalAuthGuard,
    ApiKeyGuard,
  ],
  controllers: [WalletController],
  exports: [WalletService],
})
export class WalletModule {}
