export interface PayloadType {
  sub: string;
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}
