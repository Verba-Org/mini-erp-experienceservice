import { MiddlewareConsumer, Module , ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
// import ConfigModule and ConfigService for environment-based configuration
// This isnest js way to manage configuration settings
import { ConfigService, ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MessagesModule } from './messages/messages.module';
import { UsersModule } from './users/users.module';

import { MessagesEntity } from './messages/messages.entity';
import { User } from './users/users.entity';
import { APP_PIPE } from '@nestjs/core';
const cookieSession = require('cookie-session');

// Root module of the application. It imports other feature modules to compose the application structure.

@Module({

  imports: [
    // Import HttpModule to enable HTTP communication with external services
    HttpModule,
    // Configure ConfigModule to load environment variables from .env files
    ConfigModule.forRoot({
      isGlobal: true, // make ConfigModule available globally
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`, // load environment variables from .env files based on NODE_ENV
    }),
    // Configure TypeORM with database connection settings and register entities
    // TypeOrmModule.forRoot({
    //   type: 'sqlite',
    //   // database name or file path
    //   database: 'db.sqlite',
    //   entities: [MessagesEntity, User],
    //   synchronize: true, // Note: Set to false in production to avoid data loss
    // }),
    // Change TypeORM configuration to use ConfigService for dynamic environment-based settings
    TypeOrmModule.forRootAsync({
      // imports: [ConfigModule],
      inject: [ConfigService], // inject ConfigService to access environment variables
      useFactory: (configService: ConfigService) => {
        return {
          type: configService.get<any>('DB_TYPE'), // e.g., 'sqlite'
          database: configService.get<string>('DB_NAME'), // e.g., 'db.sqlite'
          entities: [MessagesEntity, User],
          synchronize: true, // Note: Set to false in production to avoid data loss
        };
      },
    }),
    MessagesModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService,
    // Register a global validation pipe for request data validation
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe(
            { whitelist: true, // Strip properties that do not have any decorators
              forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
              transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
            }
  ), 
    }


  ],
  
})
export class AppModule {

  // Configure middleware for the application that applies to all routes.
configure(consumer: MiddlewareConsumer) {
  console.log('AppModule configured');    
  // this is similar to spring boot authentication filter where every request will go through this filter
  consumer.apply( 
    cookieSession({
      keys: ['mysecretkey'], // Replace with your own secret keys
      // maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }))
    .forRoutes('*');
}

}
