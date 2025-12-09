import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { Wallet } from 'src/wallet/entities/wallet.entity';
import { GoogleOAuthGuard } from 'src/common/guards/google.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Wallet]),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<number>('jwt.expiry') || '7d',
        },
      }),
    }),

    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    JwtAuthGuard,
    GoogleOAuthGuard,
  ],
  exports: [AuthService, JwtAuthGuard, TypeOrmModule],
})
export class AuthModule {}
