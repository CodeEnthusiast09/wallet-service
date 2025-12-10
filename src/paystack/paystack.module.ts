import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaystackController } from './paystack.controller';
import { PaystackService } from './paystack.service';
import { WalletModule } from 'src/wallet/wallet.module';
import { HttpModule } from '@nestjs/axios';
import { WebhookGuard } from 'src/common/guards/webhook.guard';

@Module({
  imports: [ConfigModule, HttpModule, forwardRef(() => WalletModule)],
  controllers: [PaystackController],
  providers: [PaystackService, WebhookGuard],
  exports: [PaystackService],
})
export class PaystackModule {}
