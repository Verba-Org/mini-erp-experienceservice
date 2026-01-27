import { CanActivate , ExecutionContext } from "@nestjs/common";

// An AuthGuard to protect routes that require authentication.
// This guard checks if the user is authenticated by verifying the presence of userId in the session.
// If userId exists, the request is allowed to proceed; otherwise, it is denied.
// This guard can be applied to routes or controllers using the @UseGuards() decorator.
// Check contollers for the usage.
export class AuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        return request.session && request.session.userId;
    }
}