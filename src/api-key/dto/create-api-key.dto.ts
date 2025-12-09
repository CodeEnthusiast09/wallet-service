import {
  IsString,
  IsArray,
  IsEnum,
  ArrayNotEmpty,
  Length,
} from 'class-validator';
import { ApiKeyPermission } from '../entities/api-key.entity';

export class CreateApiKeyDto {
  @IsString()
  @Length(3, 100, { message: 'Name must be between 3 and 100 characters' })
  name: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'Permissions array cannot be empty' })
  @IsEnum(ApiKeyPermission, { each: true, message: 'Invalid permission value' })
  permissions: ApiKeyPermission[];

  @IsString()
  @IsEnum(['1H', '1D', '1M', '1Y'], {
    message: 'Expiry must be one of: 1H, 1D, 1M, 1Y',
  })
  expiry: '1H' | '1D' | '1M' | '1Y';
}
