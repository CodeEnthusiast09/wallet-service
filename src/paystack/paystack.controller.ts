import { Controller, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { WalletService } from 'src/wallet/wallet.service';
import { WebhookGuard } from 'src/common/guards/webhook.guard';
import { PaystackWebhookDto } from './dto/paystack-webhook.dto';
import { PaystackEvents } from 'src/interface/paystack-types';
import {
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Webhooks')
@Controller('wallet/paystack')
export class PaystackController {
  private readonly logger = new Logger(PaystackController.name);

  constructor(private readonly walletService: WalletService) {}

  @Post('webhook')
  @UseGuards(WebhookGuard)
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Paystack webhook handler',
    description:
      'Internal endpoint called by Paystack to notify payment status. Signature validation required.',
  })
  @ApiResponse({ status: 201, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid signature or payload' })
  async handleWebhook(
    @Body() payload: PaystackWebhookDto,
  ): Promise<{ status: boolean }> {
    this.logger.log(`Webhook received: ${payload.event}`);

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
    this.logger.log(`Processing payment for reference: ${data.reference}`);

    await this.walletService.creditWallet(
      data.reference,
      data.amount / 100,
      data.status,
    );

    this.logger.log(`Wallet credited successfully for ${data.reference}`);
  }
}
