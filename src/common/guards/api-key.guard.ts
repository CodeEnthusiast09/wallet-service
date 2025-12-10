import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ApiKey, ApiKeyPermission } from 'src/api-key/entities/api-key.entity';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { RequestWithUser } from 'src/types/express-request-with-user';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
    private readonly reflector: Reflector, // Used to read @RequirePermissions metadata
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    // Step 1: Extract API key from header
    const apiKeyValue = request.headers['x-api-key'] as string | undefined;

    if (!apiKeyValue) {
      throw new UnauthorizedException(
        'API key is required. Provide it in the "x-api-key" header.',
      );
    }

    // Step 2: Find ALL non-revoked API keys for comparison
    // Why? Because we store hashed keys, we need to compare the provided key against all hashes
    const allApiKeys = await this.apiKeyRepository.find({
      where: { isRevoked: false },
      relations: ['user', 'user.wallet'], // Load user and wallet for @CurrentUser()
    });

    if (allApiKeys.length === 0) {
      throw new UnauthorizedException('Invalid API key.');
    }

    // Step 3: Find matching API key by comparing hashes
    let matchedApiKey: ApiKey | null = null;

    for (const apiKey of allApiKeys) {
      const isMatch = await bcrypt.compare(apiKeyValue, apiKey.keyHash);
      if (isMatch) {
        matchedApiKey = apiKey;
        break;
      }
    }

    if (!matchedApiKey) {
      throw new UnauthorizedException('Invalid API key.');
    }

    // Step 4: Check if API key is expired
    const now = new Date();
    if (matchedApiKey.expiresAt < now) {
      throw new UnauthorizedException(
        `API key expired on ${matchedApiKey.expiresAt.toISOString()}. Use the rollover endpoint to create a new key.`,
      );
    }

    // Step 5: Get required permissions from @RequirePermissions decorator
    const requiredPermissions = this.reflector.getAllAndOverride<
      ApiKeyPermission[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    // Step 6: Check if API key has required permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every((permission) =>
        matchedApiKey.permissions.includes(permission),
      );

      if (!hasAllPermissions) {
        throw new ForbiddenException(
          `API key lacks required permissions: ${requiredPermissions.join(', ')}. ` +
            `Current permissions: ${matchedApiKey.permissions.join(', ')}.`,
        );
      }
    }

    // Step 7: Attach user to request (so @CurrentUser() works)
    // Type-safe: request is RequestWithUser, so request.user expects User entity
    request.user = request.user = {
      sub: matchedApiKey.user.id,
      userId: matchedApiKey.user.id,
      email: matchedApiKey.user.email,
    };

    // Authentication and authorization successful!
    return true;
  }
}
