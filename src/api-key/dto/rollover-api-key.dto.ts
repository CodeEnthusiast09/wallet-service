import { IsString, IsEnum, IsUUID } from 'class-validator';

export class RolloverApiKeyDto {
  @IsUUID('4', { message: 'Invalid expired_key_id format' })
  expired_key_id: string;

  @IsString()
  @IsEnum(['1H', '1D', '1M', '1Y'], {
    message: 'Expiry must be one of: 1H, 1D, 1M, 1Y',
  })
  expiry: '1H' | '1D' | '1M' | '1Y';
}
