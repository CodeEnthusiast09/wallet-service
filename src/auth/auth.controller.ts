import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleOAuthGuard } from 'src/common/guards/google.guard';
import { AuthResponseDto } from './dto/auth-response.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from './entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth(): Promise<void> {}

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  googleAuthCallback(@CurrentUser() user: User): AuthResponseDto {
    return this.authService.login(user);
  }
}
