import { NestFactory } from '@nestjs/core';
// import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http.exception.filter';
// Need to do it the old way since no type definitions are available
// const cookieSession = require('cookie-session');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Configure cookie-session middleware
  // Moved to AppModule since this will make it easier to test controllers when running e2e tests
  // app.use(
  //   cookieSession({
  //     keys: ['mysecretkey'], // Replace with your own secret keys
  //     // maxAge: 24 * 60 * 60 * 1000, // 24 hours
  //   }),
  // );
  // Enable global validation pipes for request data validation
  // Moved to AppModule providers since this will make it easier to test controllers when running e2e tests
  // app.useGlobalPipes(new ValidationPipe(
  //   { whitelist: true, // Strip properties that do not have any decorators
  //     forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
  //     transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
  //   }
  // ));
  // Apply global exception filter for consistent error handling
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
