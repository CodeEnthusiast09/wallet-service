import { SetMetadata } from '@nestjs/common';
import { ApiKeyPermission } from 'src/api-key/entities/api-key.entity';

/**
 * Metadata key for storing required permissions
 * Think of this as a "label" we attach to controller methods
 */
export const PERMISSIONS_KEY = 'permissions';

export const RequirePermissions = (...permissions: ApiKeyPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
