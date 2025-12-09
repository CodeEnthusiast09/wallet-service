import {
  Controller,
  Post,
  Body,
  UseGuards,
  Delete,
  Param,
} from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RolloverApiKeyDto } from './dto/rollover-api-key.dto';
import { ApiKeyResponseDto } from './dto/api-key-response.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/auth/entities/user.entity';

@Controller('keys')
@UseGuards(JwtAuthGuard)
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post('create')
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateApiKeyDto,
  ): Promise<ApiKeyResponseDto> {
    return this.apiKeyService.create(user.id, dto);
  }

  @Post('rollover')
  async rollover(
    @CurrentUser() user: User,
    @Body() dto: RolloverApiKeyDto,
  ): Promise<ApiKeyResponseDto> {
    return this.apiKeyService.rollover(user.id, dto);
  }

  @Delete(':keyId/revoke')
  async revoke(
    @CurrentUser() user: User,
    @Param('keyId') keyId: string,
  ): Promise<{ message: string }> {
    await this.apiKeyService.revoke(user.id, keyId);
    return { message: 'API key revoked successfully' };
  }
}
