import { PaystackWebhookPayload } from 'src/interface/paystack-types';

// We just export the type - no class-validator decorators needed
export type PaystackWebhookDto = PaystackWebhookPayload;
