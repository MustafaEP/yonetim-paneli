import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Permission } from './permission.enum'; // backend permission enum'u

export interface CurrentUserData {
  userId: string;
  email: string;
  roles: string[];
  permissions?: Permission[]; // 🔹 yeni alan
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserData => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
