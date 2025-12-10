import { Request } from 'express';
import { PayloadType } from 'src/interface/payload-types';

export interface RequestWithUser extends Request {
  user: PayloadType;
}
