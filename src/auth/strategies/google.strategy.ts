import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Wallet } from 'src/wallet/entities/wallet.entity';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    private readonly configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('googleAuth.clientId')!,
      clientSecret: configService.get<string>('googleAuth.clientSecret')!,
      callbackURL: configService.get<string>('googleAuth.callbackUrl'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { id: googleId, emails, displayName } = profile;

      // Extract email from Google profile
      const email = emails?.[0]?.value;

      if (!email) {
        return done(new Error('No email found in Google profile'), false);
      }

      // Try to find existing user by Google ID
      let user = await this.userRepository.findOne({
        where: { google_id: googleId },
        relations: ['wallet'],
      });

      // If user doesn't exist, create new user + wallet
      if (!user) {
        // Create new user
        user = this.userRepository.create({
          email,
          google_id: googleId,
        });

        // Save user first (we need the user ID for wallet)
        await this.userRepository.save(user);

        // Generate unique 13-digit wallet number
        const walletNumber = this.generateWalletNumber();

        // Create wallet for the user
        const wallet = this.walletRepository.create({
          userId: user.id,
          walletNumber,
          balance: 0, // Start with zero balance
        });

        await this.walletRepository.save(wallet);

        // Reload user with wallet relation
        user = await this.userRepository.findOne({
          where: { id: user.id },
          relations: ['wallet'],
        });
      }

      // Return user to Passport (will be attached to request.user)
      return done(null, user ?? false);
    } catch (error) {
      return done(error, false);
    }
  }

  /**
   * Generate unique 13-digit wallet number
   *
   * Format: Random 13 digits
   * Example: 4566678954356
   *
   * Note: In production, you'd want to:
   * 1. Check for uniqueness in database
   * 2. Retry if collision occurs
   * 3. Use a more sophisticated algorithm
   *
   * @returns 13-digit string
   */
  private generateWalletNumber(): string {
    // Generate 13 random digits
    let walletNumber = '';
    for (let i = 0; i < 13; i++) {
      walletNumber += Math.floor(Math.random() * 10).toString();
    }
    return walletNumber;
  }
}
