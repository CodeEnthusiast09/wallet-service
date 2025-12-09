import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { PayloadType } from 'src/interface/payload-types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET')!,
      ignoreExpiration: false,
    });
  }

  async validate(payload: PayloadType): Promise<User> {
    // Extract user ID from payload
    // We support both 'sub' (JWT standard) and 'userId' (our custom field)
    const userId = payload.sub || payload.userId;

    if (!userId) {
      throw new UnauthorizedException('Invalid token payload: missing user ID');
    }

    // Load user from database with relations
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['wallet'], // Load wallet relation for easy access
    });

    // If user doesn't exist, reject authentication
    if (!user) {
      throw new UnauthorizedException(
        'User not found. Account may have been deleted.',
      );
    }

    // Return the full user entity
    // This will be attached to request.user by JwtAuthGuard
    return user;
  }
}
