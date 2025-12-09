import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ApiKey } from './entities/api-key.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RolloverApiKeyDto } from './dto/rollover-api-key.dto';
import { ApiKeyResponseDto } from './dto/api-key-response.dto';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
  ) {}

  async create(
    userId: string,
    dto: CreateApiKeyDto,
  ): Promise<ApiKeyResponseDto> {
    const activeKeysCount = await this.apiKeyRepository.count({
      where: { userId, isRevoked: false },
    });

    if (activeKeysCount >= 5) {
      throw new ForbiddenException(
        'Maximum 5 active API keys allowed per user.',
      );
    }

    const rawKey = this.generateApiKey();
    const keyHash = await bcrypt.hash(rawKey, 10);
    const expiresAt = this.calculateExpiry(dto.expiry);

    const apiKey = this.apiKeyRepository.create({
      userId,
      name: dto.name,
      keyHash,
      permissions: dto.permissions,
      expiresAt,
      isRevoked: false,
    });

    await this.apiKeyRepository.save(apiKey);

    return {
      api_key: rawKey,
      expires_at: expiresAt,
    };
  }

  async rollover(
    userId: string,
    dto: RolloverApiKeyDto,
  ): Promise<ApiKeyResponseDto> {
    const expiredKey = await this.apiKeyRepository.findOne({
      where: { id: dto.expired_key_id, userId },
    });

    if (!expiredKey) {
      throw new NotFoundException('API key not found.');
    }

    const now = new Date();
    if (expiredKey.expiresAt > now) {
      throw new BadRequestException('API key is not expired yet.');
    }

    const activeKeysCount = await this.apiKeyRepository.count({
      where: { userId, isRevoked: false },
    });

    if (activeKeysCount >= 5) {
      throw new ForbiddenException(
        'Maximum 5 active API keys allowed. Revoke one first.',
      );
    }

    const rawKey = this.generateApiKey();
    const keyHash = await bcrypt.hash(rawKey, 10);
    const expiresAt = this.calculateExpiry(dto.expiry);

    const newApiKey = this.apiKeyRepository.create({
      userId,
      name: expiredKey.name,
      keyHash,
      permissions: expiredKey.permissions,
      expiresAt,
      isRevoked: false,
    });

    await this.apiKeyRepository.save(newApiKey);

    return {
      api_key: rawKey,
      expires_at: expiresAt,
    };
  }

  async revoke(userId: string, keyId: string): Promise<void> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id: keyId, userId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found.');
    }

    apiKey.isRevoked = true;
    await this.apiKeyRepository.save(apiKey);
  }

  private generateApiKey(): string {
    const randomBytes = crypto.randomBytes(32);
    return `sk_live_${randomBytes.toString('hex')}`;
  }

  private calculateExpiry(expiry: '1H' | '1D' | '1M' | '1Y'): Date {
    const now = new Date();

    switch (expiry) {
      case '1H':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case '1D':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case '1M':
        return new Date(now.setMonth(now.getMonth() + 1));
      case '1Y':
        return new Date(now.setFullYear(now.getFullYear() + 1));
      default:
        throw new BadRequestException('Invalid expiry format');
    }
  }
}
