// import {
//   Controller,
//   Post,
//   Headers,
//   Req,
//   BadRequestException,
// } from '@nestjs/common';
// import { PaystackService } from './paystack.service';
// import { WalletService } from 'src/wallet/wallet.service';
// import { PaystackWebhookDto } from './dto/paystack-webhook.dto';
// import { plainToInstance } from 'class-transformer';
// import { validateOrReject } from 'class-validator';

// @Controller('wallet/paystack')
// export class PaystackController {
//   constructor(
//     private readonly paystackService: PaystackService,
//     private readonly walletService: WalletService,
//   ) {}

//   @Post('webhook')
//   async handleWebhook(
//     @Headers('x-paystack-signature') signature: string,
//     @Req() req: Request & { rawBody?: Buffer },
//   ): Promise<{ status: boolean }> {
//     console.log("let me see what's wrong");

//     if (!signature) {
//       throw new BadRequestException('Missing signature');
//     }

//     const rawBody = req.rawBody?.toString('utf8');
//     if (!rawBody) {
//       throw new BadRequestException('Missing request body');
//     }

//     const isValid = this.paystackService.validateWebhookSignature(
//       rawBody,
//       signature,
//     );

//     if (!isValid) {
//       throw new BadRequestException('Invalid signature');
//     }

//     // Parse and validate the webhook payload safely
//     let webhookData: PaystackWebhookDto;
//     try {
//       const parsed = plainToInstance(PaystackWebhookDto, JSON.parse(rawBody));
//       await validateOrReject(parsed, {
//         whitelist: true,
//         forbidNonWhitelisted: true,
//       });
//       webhookData = parsed;
//     } catch (err) {
//       throw new BadRequestException('Invalid webhook payload');
//     }

//     if (webhookData.event === 'charge.success') {
//       await this.walletService.creditWallet(
//         webhookData.data.reference,
//         webhookData.data.amount / 100,
//         webhookData.data.status,
//       );
//     }

//     return { status: true };
//   }
// }

// import { Controller, Post, Body, UseGuards } from '@nestjs/common';
// import { WalletService } from 'src/wallet/wallet.service';
// import { PaystackWebhookDto } from './dto/paystack-webhook.dto';
// import { WebhookGuard } from 'src/common/guards/webhook.guard';

// @Controller('wallet/paystack')
// export class PaystackController {
//   constructor(private readonly walletService: WalletService) {}

//   @Post('webhook')
//   @UseGuards(WebhookGuard)
//   async handleWebhook(
//     @Body() webhookData: PaystackWebhookDto,
//   ): Promise<{ status: boolean }> {
//     console.log('✅ Webhook received:', webhookData.event);

//     if (webhookData.event === 'charge.success') {
//       await this.walletService.creditWallet(
//         webhookData.data.reference,
//         webhookData.data.amount / 100,
//         webhookData.data.status,
//       );
//     }

//     return { status: true };
//   }
// }

// import { Controller, Post, Body, UseGuards, Logger } from '@nestjs/common';
// import { WalletService } from 'src/wallet/wallet.service';
// import { PaystackWebhookDto } from './dto/paystack-webhook.dto';
// import { WebhookGuard } from 'src/common/guards/webhook.guard';

// @Controller('wallet/paystack')
// export class PaystackController {
//   private readonly logger = new Logger(PaystackController.name);

//   constructor(private readonly walletService: WalletService) {}

//   @Post('webhook')
//   @UseGuards(WebhookGuard)
//   async handleWebhook(
//     @Body() webhookData: PaystackWebhookDto,
//   ): Promise<{ status: boolean }> {
//     this.logger.log('✅ Webhook received:', webhookData.event);
//     this.logger.log('📦 Full payload:', JSON.stringify(webhookData, null, 2));

//     if (webhookData.event === 'charge.success') {
//       this.logger.log('💰 Processing charge.success event');

//       await this.walletService.creditWallet(
//         webhookData.data.reference,
//         webhookData.data.amount / 100,
//         webhookData.data.status,
//       );

//       this.logger.log('✅ Wallet credited successfully');
//     }

//     return { status: true };
//   }
// }

import { Controller, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { WalletService } from 'src/wallet/wallet.service';
import { WebhookGuard } from 'src/common/guards/webhook.guard';
import { PaystackWebhookDto } from './dto/paystack-webhook.dto';
import { PaystackEvents } from 'src/interface/paystack-types';

@Controller('wallet/paystack')
export class PaystackController {
  private readonly logger = new Logger(PaystackController.name);

  constructor(private readonly walletService: WalletService) {}

  @Post('webhook')
  @UseGuards(WebhookGuard)
  async handleWebhook(
    @Body() payload: PaystackWebhookDto,
  ): Promise<{ status: boolean }> {
    this.logger.log(`✅ Webhook received: ${payload.event}`);

    switch (payload.event) {
      case PaystackEvents.PAYMENT_SUCCESSFUL:
        await this.handleSuccessfulPayment(payload.data);
        break;
      default:
        this.logger.log(`Unhandled webhook event: ${payload.event}`);
    }

    return { status: true };
  }

  private async handleSuccessfulPayment(data: PaystackWebhookDto['data']) {
    this.logger.log(`💰 Processing payment for reference: ${data.reference}`);

    await this.walletService.creditWallet(
      data.reference,
      data.amount / 100, // Convert kobo to naira
      data.status,
    );

    this.logger.log(`✅ Wallet credited successfully for ${data.reference}`);
  }
}
