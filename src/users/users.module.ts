import { Module , MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';
// import { CurrentUserInterceptor } from 'src/common/interceptors/current-user.interceptor';
import { CurrentUserMiddleware } from 'src/common/middlewares/current-user.middleware';

import { User } from './users.entity';

// Module definition for Users. Modules are used to organize related components, controllers, and services in a NestJS application.

@Module({
  // Auto-register the User entity with TypeORM in this module and generate the necessary repository classes
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  // APP_INTERCEPTOR is a special token that allows us to register a global interceptor
  // by providing the CurrentUserInterceptor class here, it will be applied to all incoming requests in the application
  providers: [UsersService , AuthService, 
    // replace with middleware
  //   {
  //   provide: APP_INTERCEPTOR,
  //   useClass: CurrentUserInterceptor,
  // }
],
  exports: [UsersService],
})
export class UsersModule {

  // Configure middleware for this module that applies to all routes within the UsersModule.
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CurrentUserMiddleware)
      .forRoutes('*'); // Apply to all routes in this module
  }
}
