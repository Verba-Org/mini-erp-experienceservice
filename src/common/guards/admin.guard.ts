import { CanActivate, ExecutionContext } from "@nestjs/common";


// An AdminGuard to protect routes that require admin privileges.
// This guard checks if the authenticated user has admin rights by verifying the 'admin' property on the user object.
// If the user is an admin, the request is allowed to proceed; otherwise, it is denied.
// This guard can be applied to routes or controllers using the @UseGuards() decorator.
// Check controllers for the usage.
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        if(!request.user) {
            return false;
        }

        return request.user.admin;
    }
}