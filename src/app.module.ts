import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmAsyncConfig } from 'db/datasource';
import configuration from './config/configuration';
import { validate } from 'env.validation';
import { AuthModule } from './auth/auth.module';
import { WalletModule } from './wallet/wallet.module';
import { TransactionModule } from './transaction/transaction.module';
import { ApiKeyModule } from './api-key/api-key.module';
import { PaystackModule } from './paystack/paystack.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [configuration],
      validate: validate,
    }),
    AuthModule,
    WalletModule,
    TransactionModule,
    ApiKeyModule,
    PaystackModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
