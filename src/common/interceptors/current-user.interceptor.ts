import { NestInterceptor, ExecutionContext, CallHandler, Injectable } from "@nestjs/common";
import { UsersService } from "src/users/users.service";

/*
* @deprecated Interceprots are invoked after middleware and guards.
* The auth guards will have already run before this interceptor is called.
* Consider using middleware for attaching the current user to the request object instead.
* 
*/

// Interceptor to fetch and attach the current user to the request object based on the userId stored in the session.
// the CurrentUser decorator can then retrieve this user from the request object.
// @Injectable()

export class CurrentUserInterceptor implements NestInterceptor {
    constructor(private usersService: UsersService) {}

    async intercept(context: ExecutionContext, next: CallHandler) {
        const request = context.switchToHttp().getRequest();
        const { userId } = request.session || {};

        if (userId) {
            const user = await this.usersService.findOne(userId);
            request.user = user;
        }

        return next.handle();
    }
}