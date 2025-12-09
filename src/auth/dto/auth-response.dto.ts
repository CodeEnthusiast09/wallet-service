export class AuthResponseDto {
  access_token: string;
  user: {
    id: string;
    email: string;
    wallet_number: string;
  };
}
