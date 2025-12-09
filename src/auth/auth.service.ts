import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { AuthResponseDto } from './dto/auth-response.dto';
import { PayloadType } from 'src/interface/payload-types';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  generateToken(user: User): string {
    const payload: PayloadType = {
      sub: user.id,
      userId: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload);
  }

  login(user: User): AuthResponseDto {
    const accessToken = this.generateToken(user);
    return {
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        wallet_number: user.wallet?.walletNumber || '',
      },
    };
  }
}
