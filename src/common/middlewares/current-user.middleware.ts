import { NestMiddleware, Injectable } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/users.entity';
import { UserSessionEntity } from 'src/users/user-session-entity';

declare global {
  namespace Express {
    interface Request {
      user?: User | null;
      userSession?: UserSessionEntity | null; // You can replace 'any' with the actual type of your session object
    }
  }
}

// Middleware to attach the current user to the request object based on the userId stored in the session.
// This allows subsequent handlers (controllers, guards, etc.) to access the authenticated user's information.
@Injectable()
export class CurrentUserMiddleware implements NestMiddleware {
  constructor(private usersService: UsersService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // const { userId } = req.session || {};

    // if (userId) {
    //     const user = await this.usersService.findOne(userId);
    //     req.user = user;
    // }

    const body = req.body;
    if (body && body.from) {
      const whatsappNumber = body.from.replace('whatsapp:', '');
      let userSession = await this.usersService.getSession(whatsappNumber);
      if (!userSession) {
        userSession = await this.usersService.createSession(
          whatsappNumber,
          [],
          new Date(Date.now() + 24 * 60 * 60 * 1000),
        ); // Create a new session that expires in 24 hours
      }

      req.userSession = userSession;
    }

    next();

    // update user session before response is sent
    if (req.userSession) {
      await this.usersService.updateSession(req.userSession);
    }
  }
}
