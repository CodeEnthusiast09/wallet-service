import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PayloadType } from 'src/interface/payload-types';
import { RequestWithUser } from 'src/types/express-request-with-user';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): PayloadType => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();

    // The user object is attached to request by our guards
    // request.user could be from JWT or API Key authentication
    return request.user;
  },
);
