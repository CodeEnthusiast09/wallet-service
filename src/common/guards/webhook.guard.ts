// import {
//   CanActivate,
//   ExecutionContext,
//   Injectable,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import * as crypto from 'crypto';
// import { Request } from 'express';

// @Injectable()
// export class WebhookGuard implements CanActivate {
//   constructor(private readonly configService: ConfigService) {}

//   canActivate(context: ExecutionContext): boolean {
//     const request = context.switchToHttp().getRequest<Request>();

//     const secret = this.configService.get<string>('paystack.secretKey');

//     if (!secret) {
//       throw new UnauthorizedException('Paystack secret key not configured');
//     }

//     const signature = request.headers['x-paystack-signature'] as string;

//     if (!signature) {
//       throw new UnauthorizedException('No signature provided');
//     }

//     const hash = crypto
//       .createHmac('sha512', secret)
//       .update(JSON.stringify(request.body))
//       .digest('hex');

//     const signatureBuffer = Buffer.from(signature);
//     const hashBuffer = Buffer.from(hash);

//     try {
//       const isValid =
//         signatureBuffer.length === hashBuffer.length &&
//         crypto.timingSafeEqual(signatureBuffer, hashBuffer);

//       if (!isValid) {
//         throw new UnauthorizedException('Invalid signature');
//       }

//       return true;
//     } catch {
//       throw new UnauthorizedException('Invalid signature');
//     }
//   }
// }

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Request } from 'express';

@Injectable()
export class WebhookGuard implements CanActivate {
  private readonly logger = new Logger(WebhookGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    this.logger.log('🔒 WebhookGuard triggered');

    const request = context.switchToHttp().getRequest<Request>();

    const secret = this.configService.get<string>('paystack.secretKey');

    if (!secret) {
      this.logger.error('❌ Paystack secret key not configured');
      throw new UnauthorizedException('Paystack secret key not configured');
    }

    const signature = request.headers['x-paystack-signature'] as string;
    this.logger.log('🔑 Signature from Paystack:', signature);

    if (!signature) {
      this.logger.error('❌ No signature provided');
      throw new UnauthorizedException('No signature provided');
    }

    const bodyString = JSON.stringify(request.body);
    this.logger.log('📄 Request body:', bodyString);

    const hash = crypto
      .createHmac('sha512', secret)
      .update(bodyString)
      .digest('hex');

    this.logger.log('🔐 Computed hash:', hash);
    this.logger.log('🔐 Expected signature:', signature);

    const signatureBuffer = Buffer.from(signature);
    const hashBuffer = Buffer.from(hash);

    try {
      const isValid =
        signatureBuffer.length === hashBuffer.length &&
        crypto.timingSafeEqual(signatureBuffer, hashBuffer);

      if (!isValid) {
        this.logger.error('❌ Invalid signature');
        throw new UnauthorizedException('Invalid signature');
      }

      this.logger.log('✅ Signature validated successfully');
      return true;
    } catch (error) {
      this.logger.error('❌ Signature validation failed:', error);
      throw new UnauthorizedException('Invalid signature');
    }
  }
}
