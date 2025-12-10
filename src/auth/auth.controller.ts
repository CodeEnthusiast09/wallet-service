import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleOAuthGuard } from 'src/common/guards/google.guard';
import { AuthResponseDto } from './dto/auth-response.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({
    summary: 'Initiate Google OAuth login',
    description:
      'Redirects to Google OAuth consent page. Use this in a browser.',
  })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth' })
  async googleAuth(): Promise<void> {}

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth callback',
    description: 'Handles Google OAuth callback and returns JWT token',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Authentication failed' })
  googleAuthCallback(@CurrentUser() user: User): AuthResponseDto {
    return this.authService.login(user);
  }
}
