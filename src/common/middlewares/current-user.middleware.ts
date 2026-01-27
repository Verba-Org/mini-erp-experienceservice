import { NestMiddleware, Injectable } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { UsersService } from "src/users/users.service";
import { User } from "src/users/users.entity";

declare global {
    namespace Express {
        interface Request {
            user?: User | null; 
        }
    }
}

// Middleware to attach the current user to the request object based on the userId stored in the session.
// This allows subsequent handlers (controllers, guards, etc.) to access the authenticated user's information.
@Injectable()
export class CurrentUserMiddleware implements NestMiddleware {
    constructor(private usersService: UsersService) {}

    async use(req: Request, res: Response, next: NextFunction) {
        const { userId } = req.session || {};

        if (userId) {
            const user = await this.usersService.findOne(userId);
            req.user = user;
        }

        next();
    }
}   