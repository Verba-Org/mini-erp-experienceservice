# Mini ERP System

This is the experience / layer of the mini ERP system. It provides a simple interface for managing business processes such as inventory, sales, and customer relationships. The application recieves requests from whatsapp to create and manage invoices, customers, products, and more.

The experience layer is built using NestJS, a progressive Node.js framework for building efficient and scalable server-side applications. It leverages TypeScript for type safety and modern JavaScript features.

It exposes endpoints that are invoked by Whatsapp which inturn then communicates with AI services to process the requests and perform the necessary operations.

## Exposed services

- **Messages Controller**: Handles incoming messages from Whatsapp and routes them to the appropriate service for processing.

## Insatallation

Install '@nestjs/cli' globally if you haven't already:

```bash
npm install -g @nestjs/cli
```

Run the below command to create a new NestJS project:

```bash
nest new mini-erp-experience
```

Generate the Messages module, controller, and service:

```bash
nest generate module messages
nest generate controller mesages/messages
nest generate service messages
```

Install necessary dependencies for validation:

```bashbash
npm install class-validator class-transformer
```

### How Validation Works

To enable validation in your NestJS application, you need to set up global validation pipes in your main.ts file. This ensures that any incoming request data is validated according to the rules defined in your DTOs (Data Transfer Objects).
In your main.ts file, import the ValidationPipe from @nestjs/common and apply it globally using app.useGlobalPipes().

#### use of class-validator and class-transformer

In your DTOs, you can use decorators from class-validator to define validation rules for your data transfer objects. For example, you can use @IsString(), @IsNotEmpty(), and other decorators to enforce specific constraints on the properties of your DTOs.

The incoming request is transformed into an instance of the DTO class using class-transformer, and the validation rules are applied automatically by the ValidationPipe. The class-validator library checks the data against the defined rules and throws validation errors if any constraints are violated. The DTOs help ensure that the data received by your controllers is valid and meets the expected criteria before further processing.

At runtime javascript does not have type information. The **"emitDecoratorMetadata": true** option in tsconfig.json allows TypeScript to emit metadata about the types of properties and parameters at runtime. This metadata is used by class-transformer and class-validator to perform validation based on the types defined in your DTOs.

### TypeOrm Integration

TypeOrm is an Object-Relational Mapping (ORM) library that allows you to interact with databases using TypeScript/JavaScript objects instead of writing raw SQL queries. It provides a higher-level abstraction for database operations, making it easier to work with databases in a more object-oriented way. This is similar to how JPA/Hibernate works in Java/Spring Boot applications.

To integrate TypeOrm into your NestJS application, you need to install the necessary packages and configure the database connection. Here are the steps to set up TypeOrm:

1. Install TypeOrm and the database driver (e.g., for PostgreSQL):

```bash
npm install --save @nestjs/typeorm typeorm sqlite3
```

We are using sqlite for simplicity.

## NestJS Core Concepts

This application leverages several key NestJS architectural patterns and features:

### Modules

Modules are containers for a set of closely related components (controllers, services, providers). They help organize code into feature-based structures and manage dependencies.

In this application:

- **AppModule**: Root module that imports and configures the entire application, including TypeOrmModule for database setup and feature modules (UsersModule, MessagesModule)
- **UsersModule**: Encapsulates user-related functionality with controller, service, and entity
- **MessagesModule**: Encapsulates message-related functionality

Each module uses `@Module()` decorator to define imports, controllers, providers, and exports.

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Makes service available to other modules
})
export class UsersModule {}
```

### Controllers

Controllers handle incoming HTTP requests and return responses. They define routes and route handlers using decorators like `@Post()`, `@Get()`, `@Patch()`, and `@Delete()`.

Example from UsersController:

```typescript
@Controller('auth')
export class UsersController {
  @Post('/signup')
  createUser(@Body() user: CreateUserDtos) {
    return this.usersService.createUser(user.email, user.password);
  }

  @Get('/:id')
  getUser(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
```

### Services

Services contain business logic and are responsible for data operations. They are injectable and reusable across controllers and other services.

The `UsersService` provides methods for:

- Creating users
- Finding users by ID or email
- Updating user information
- Removing users

Services use dependency injection to access repositories:

```typescript
constructor(@InjectRepository(User) private userRepository: Repository<User>) {}
```

### Interceptors

Interceptors are used to transform responses or add cross-cutting concerns. In this application, a **Serialize Interceptor** is used to exclude sensitive fields from responses.

Applied via `@Serialize()` decorator:

```typescript
@Get()
@Serialize(UserDto)
getUsersByEmail(@Query('email') email: string) {
  return this.usersService.find(email);
}
```

The interceptor transforms the response using the provided DTO, ensuring passwords and other sensitive data are not sent to clients.

### Exception Filters

Exception filters catch and handle exceptions thrown during request processing. They provide a centralized way to format error responses.

Setup in `main.ts`:

```typescript
app.useGlobalFilters(new HttpExceptionFilter());
```

The filter catches exceptions and returns consistent JSON responses:

```json
{
  "statusCode": 404,
  "message": "User not found",
  "timestamp": "2026-01-17T10:30:00.000Z",
  "path": "/auth/123"
}
```

Services throw NestJS exceptions for proper handling:

```typescript
throw new NotFoundException('User not found');
```

### Data Transfer Objects (DTOs)

DTOs define the shape of data for incoming requests and outgoing responses. They use `class-validator` decorators for validation.

Example - `CreateUserDtos`:

```typescript
export class CreateUserDtos {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

Example - `UpdateUserDto` (with optional fields):

```typescript
export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;
}
```

The `?` symbol makes a property optional, meaning it doesn't have to be present when creating or updating data.

### Validation Pipe

The `ValidationPipe` automatically validates incoming request data against DTO rules. Applied globally in `main.ts`:

```typescript
app.useGlobalPipes(new ValidationPipe());
```

When validation fails, NestJS returns a 400 Bad Request with validation errors.

### Dependency Injection

NestJS uses constructor injection for dependencies. The framework automatically resolves and injects required services, repositories, and providers.

Example:

```typescript
@Controller('auth')
export class UsersController {
  constructor(private usersService: UsersService) {}
  // usersService is automatically injected
}
```

### Database Integration (TypeORM)

TypeORM is an ORM that maps database tables to TypeScript entities. Repositories provide methods for database operations.

Feature module setup:

```typescript
imports: [TypeOrmModule.forFeature([User])];
```

Service usage:

```typescript
@InjectRepository(User)
private userRepository: Repository<User>

async findOne(id: string) {
  return this.userRepository.findOne({ where: { id } });
}
```

### Decorators Used

- `@Controller()`: Defines a controller class
- `@Post()`, `@Get()`, `@Patch()`, `@Delete()`: HTTP method decorators
- `@Body()`, `@Param()`, `@Query()`: Extract data from requests
- `@InjectRepository()`: Inject TypeORM repositories
- `@Serialize()`: Apply response interceptor
- `@Module()`: Define a module
- `@Injectable()`: Mark class as a provider
- `@Catch()`: Mark exception filter class
- `@IsOptional()`: Mark DTO field as optional
- `@IsEmail()`, `@IsString()`, `@MinLength()`: Validation decorators

### Async/Await in Controllers

NestJS automatically handles Promise resolution. Even without `await`, returning a Promise works because NestJS detects and waits for it before sending the response. However, using `async/await` is recommended for consistency and better error handling:

```typescript
@Patch('/:id')
async updateUser(@Param('id') id: string, @Body() body: UpdateUserDto) {
  return await this.usersService.update(id, body);
}
```

## Session Management

This application implements session management using **cookie-session middleware** to maintain user authentication state across requests.

### How Session Management Works

The application uses the `cookie-session` middleware, which is configured in `main.ts`. This middleware automatically encrypts session data and stores it in secure HTTP-only cookies on the client side.

**Configuration in `main.ts`:**

```typescript
app.use(
  cookieSession({
    keys: ['mysecretkey'], // Secret keys for encryption
    // maxAge: 24 * 60 * 60 * 1000, // Optional: Set session expiration time (e.g., 24 hours)
  }),
);
```

### Session Lifecycle

1. **Sign Up** (`POST /auth/signup`):
   - User credentials are validated and a new user is created
   - Upon successful creation, the user's `id` is stored in the session: `session.userId = storedUser.id`
   - A secure session cookie is automatically created and sent to the client

2. **Sign In** (`POST /auth/signin`):
   - User credentials are verified using the `AuthService`
   - Upon successful authentication, the user's `id` is stored in the session: `session.userId = storedUser.id`
   - The session cookie is sent to the client (or updated if already exists)

3. **Verify Session** (`GET /auth/whoami`):
   - Retrieves the current user from the session using `session.userId`
   - Allows clients to verify who they are authenticated as
   - Returns user details (serialized via `UserDto` to exclude sensitive data)

4. **Sign Out** (`POST /auth/signout`):
   - Clears the session by setting `session.userId = null`
   - The session cookie is effectively invalidated

### Session Decorator

The `@Session()` decorator is used in controllers to inject the session object:

```typescript
@Post('/signin')
async signIn(@Body() user: CreateUserDtos, @Session() session: any) {
  const storedUser = await this.authService.signIn(user.email, user.password);
  session.userId = storedUser.id;
  return storedUser;
}
```

The session object is populated by the cookie-session middleware and allows you to store and retrieve user-specific data across requests.

### Authentication Flow

```
Client Request → Cookie-Session Middleware
  ↓
Session data extracted from cookie
  ↓
@Session() decorator injects session into controller
  ↓
Business logic processes request (sign up/sign in/verify/sign out)
  ↓
Session is modified (userId stored/cleared)
  ↓
Response is sent with updated session cookie
```

### Security Considerations

- **Encrypted Cookies**: Session data is encrypted using the configured secret keys, ensuring it cannot be tampered with by clients
- **HttpOnly Flag**: Cookies are set with `HttpOnly` flag (default in cookie-session), preventing client-side JavaScript access
- **Session Expiration**: Optionally configure `maxAge` to automatically expire sessions after a set duration
- **Password Hashing**: User passwords are hashed using scrypt algorithm and stored with salt for additional security

### AuthService

The `AuthService` handles the cryptographic operations for user authentication:

```typescript
async signUp(email: string, password: string) {
  // Verify user doesn't already exist
  const [user] = await this.usersService.find(email);
  if (user) throw new Error('User already exists');

  // Hash password with random salt
  const salt = randomBytes(8).toString('hex');
  const hash = (await scryptAsync(password, salt, 32)) as Buffer;
  const hashedPassword = salt + '.' + hash.toString('hex');

  return this.usersService.createUser(email, hashedPassword);
}

async signIn(email: string, password: string) {
  // Find user and verify password
  const [user] = await this.usersService.find(email);
  if (!user) throw new Error('User not found');

  // Verify password matches stored hash
  const [salt, storedHash] = user.password.split('.');
  const hash = (await scryptAsync(password, salt, 32)) as Buffer;

  if (storedHash !== hash.toString('hex')) {
    throw new Error('Invalid password');
  }

  return user;
}
```

## Guards and Authentication Process

This application implements a comprehensive authentication and authorization system using NestJS Guards, Interceptors, and custom decorators. This multi-layered approach ensures that protected routes are accessible only to authenticated users.

### What are Guards?

Guards are NestJS classes that implement the `CanActivate` interface. They determine whether a request should be allowed to proceed to the route handler or be rejected. Guards are executed before route handlers and can access the execution context, including the request object, session data, and other metadata.

### AuthGuard

The `AuthGuard` is a custom guard that protects routes by checking if a user is authenticated.

**Location**: `src/common/guards/auth.guard.ts`

**How it works**:
```typescript
export class AuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        // Check if session exists and contains userId
        return request.session && request.session.userId;
    }
}
```

The guard:
1. Extracts the HTTP request from the execution context
2. Checks if `session.userId` exists (set during sign-in)
3. Returns `true` if user is authenticated, `false` otherwise
4. If `false`, NestJS automatically returns a 403 Forbidden response

**Usage in Controllers**:
```typescript
@Get('/whoami')
@UseGuards(AuthGuard)
whoAmI(@CurrentUser() user: User) {
    return user;
}
```

The `@UseGuards(AuthGuard)` decorator applies the guard to the route. Only authenticated users with a valid session can access this endpoint.

### What are Interceptors?

Interceptors are NestJS classes that implement the `NestInterceptor` interface. They intercept requests before they reach the route handler and responses before they are sent to the client. Interceptors can be used for:
- Logging and monitoring
- Transforming request/response data
- Adding metadata to requests
- Caching
- Authentication-related preprocessing

### CurrentUserInterceptor

The `CurrentUserInterceptor` enriches the request with the currently authenticated user by fetching user details from the database based on the `userId` stored in the session.

**Location**: `src/common/interceptors/current-user.interceptor.ts`

**How it works**:
```typescript
@Injectable()
export class CurrentUserInterceptor implements NestInterceptor {
    constructor(private usersService: UsersService) {}

    async intercept(context: ExecutionContext, next: CallHandler) {
        const request = context.switchToHttp().getRequest();
        const { userId } = request.session || {};

        // If userId exists in session, fetch the user from database
        if (userId) {
            const user = await this.usersService.findOne(userId);
            // Attach user to request object for use in controllers
            request.user = user;
        }

        // Continue with the request processing
        return next.handle();
    }
}
```

**Key Points**:
1. The interceptor runs before the route handler
2. It extracts `userId` from `session.userId`
3. It queries the database to fetch complete user details
4. The user object is attached to `request.user` for later use
5. The request continues to the route handler with the user attached

**Global Registration**: This interceptor is registered globally in `users.module.ts` so it applies to all routes:
```typescript
{
  provide: 'APP_INTERCEPTOR',
  useClass: CurrentUserInterceptor,
}
```

### CurrentUser Decorator

The `@CurrentUser()` decorator is a custom parameter decorator that extracts the user object from the request. It provides a clean way to access the current authenticated user in route handlers.

**Location**: `src/common/decorators/current-user.decorator.ts`

**Implementation**:
```typescript
export const CurrentUser = createParamDecorator(
  (data: never, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // Return the user object that was attached by CurrentUserInterceptor
    return request.user;
  },
);
```

**Usage**:
```typescript
@Get('/whoami')
@UseGuards(AuthGuard)
whoAmI(@CurrentUser() user: User) {
    return user;  // user parameter contains the authenticated user object
}
```

Instead of accessing `request.user` manually, the decorator injects the user directly as a parameter, making the code cleaner and more maintainable.

### Complete Authentication Flow Diagram

```
1. Client sends authenticated request (with session cookie)
         ↓
2. Express Session Middleware (cookie-session)
   - Decrypts and validates cookie
   - Populates request.session with data (including userId)
         ↓
3. CurrentUserInterceptor (runs for all routes)
   - Extracts userId from session
   - Queries database for full user object
   - Attaches user to request.user
         ↓
4. AuthGuard (if @UseGuards(AuthGuard) decorator present)
   - Checks if session.userId exists
   - Returns true (allow) or false (deny)
   - If false, request rejected with 403 Forbidden
         ↓
5. Route Handler (if guard allows)
   - @CurrentUser() decorator extracts request.user
   - Route handler receives user object as parameter
   - Business logic processes with authenticated user
         ↓
6. Serialize Interceptor
   - Transforms response using UserDto
   - Removes sensitive fields (password, etc.)
   - Sends clean response to client
```

### Authentication Sequence for Protected Routes

**Example: Getting current user with authentication**

1. **Client Request**:
   ```
   GET /auth/whoami
   Cookie: session=encrypted_session_data
   ```

2. **Middleware Processing**:
   - Cookie-session decrypts and extracts `userId`
   - `request.session.userId = "user-123"`

3. **CurrentUserInterceptor**:
   - Detects `userId` in session
   - Calls `usersService.findOne("user-123")`
   - Sets `request.user = { id: "user-123", email: "...", ... }`

4. **AuthGuard Check**:
   - Evaluates `request.session && request.session.userId`
   - Returns `true` (user is authenticated)
   - Allows request to proceed

5. **Route Handler Execution**:
   - `@CurrentUser()` decorator extracts `request.user`
   - `whoAmI(user)` is called with user object
   - Returns user data to client

6. **Response Serialization**:
   - `@Serialize(UserDto)` filters out password field
   - Sends `{ id: "user-123", email: "user@example.com" }` to client

### When Guards Deny Access

If a request reaches a protected route without valid authentication:

```
1. Client sends request without session cookie (or expired)
         ↓
2. request.session is null or session.userId is undefined
         ↓
3. AuthGuard.canActivate() returns false
         ↓
4. NestJS automatically responds with 403 Forbidden
         ↓
5. Route handler is never executed
```

### Comparison: Guards vs Interceptors vs Middleware

| Feature | Middleware | Guards | Interceptors |
|---------|-----------|--------|--------------|
| **Purpose** | Request/response transformation | Authorization logic | Preprocessing/postprocessing |
| **Execution Order** | First (Express middleware) | After middleware, before handler | Before and after handler |
| **Can block requests** | Yes | Yes | No (but can throw errors) |
| **Access to ExecutionContext** | No | Yes | Yes |
| **Use Cases** | Parsing, logging | Permission checking | Data transformation, user enrichment |
| **Example** | Body parser, CORS | AuthGuard, RoleGuard | CurrentUserInterceptor, logging |

### Best Practices

1. **Use Guards for Authorization**: Guards should check whether a user has permission to access a resource
2. **Use Interceptors for Enrichment**: Interceptors should prepare data (like fetching the current user)
3. **Combine with Serialization**: Always use `@Serialize()` to prevent sensitive data leakage
4. **Error Handling**: Guards that deny access should throw `ForbiddenException` instead of returning false for clearer error messages:
   ```typescript
   if (!isAuthorized) {
       throw new ForbiddenException('Access denied');
   }
   return true;
   ```
5. **Database Queries in Interceptors**: Cache user data if possible to avoid repeated database queries
6. **Test Guards and Interceptors**: Always test authentication logic with unit and integration tests

### Protected Routes in Application

Currently protected routes that require authentication:
- `GET /auth/whoami` - Get current authenticated user (requires AuthGuard)

Protected routes can be extended to other controllers by adding `@UseGuards(AuthGuard)` decorator to route handlers or entire controller classes.

## Configuration Management with ConfigService

The application uses NestJS's `@nestjs/config` package to manage environment-based configuration settings dynamically. This approach separates configuration from code, making the application flexible across different environments (development, testing, production).

### What is ConfigService?

`ConfigService` is a NestJS service provided by the `@nestjs/config` module that allows you to:
- Load environment variables from `.env` files
- Access configuration values throughout the application
- Support different configurations for different environments
- Provide type-safe configuration access

### ConfigModule Setup

**Location**: `src/app.module.ts`

The ConfigModule is initialized in the AppModule with the following configuration:

```typescript
ConfigModule.forRoot({
  isGlobal: true, // Make ConfigModule available globally across all modules
  envFilePath: `.env.${process.env.NODE_ENV || 'development'}`, // Load .env files based on NODE_ENV
})
```

**Key Configuration Options**:
- **`isGlobal: true`**: Makes `ConfigService` available in all modules without importing ConfigModule in each module
- **`envFilePath`**: Dynamically loads the appropriate environment file based on the `NODE_ENV` environment variable
  - Development: `.env.development`
  - Testing: `.env.test`
  - Production: `.env.production` (or custom)

### Environment Files

The project uses separate environment files for different contexts:

**`.env.development` (Local Development)**:
```dotenv
DB_NAME=db.sqlite
DB_TYPE=sqlite
PORT=3000
```

**`.env.test` (Testing)**:
```dotenv
DB_NAME=test.sqlite
DB_TYPE=sqlite
```

**Naming Convention**: Use the pattern `.env.<ENVIRONMENT>` where `<ENVIRONMENT>` matches the `NODE_ENV` value.

### How ConfigService Works

#### 1. Loading Environment Variables

When the application starts:
1. Node.js `NODE_ENV` variable is checked (defaults to `'development'` if not set)
2. ConfigModule loads the corresponding `.env.{NODE_ENV}` file
3. All variables are parsed and made available through `ConfigService`

#### 2. Accessing Configuration Values

ConfigService provides the `get()` method to access configuration values:

```typescript
// Basic usage
const dbName = configService.get<string>('DB_NAME');

// With type safety
const dbType = configService.get<'sqlite' | 'postgres'>('DB_TYPE');

// With default values
const port = configService.get<number>('PORT', 3000);
```

### TypeORM Configuration with ConfigService

The application demonstrates practical use of ConfigService for dynamic TypeORM configuration:

**Location**: `src/app.module.ts`

```typescript
TypeOrmModule.forRootAsync({
  inject: [ConfigService], // Inject ConfigService as a dependency
  useFactory: (configService: ConfigService) => {
    return {
      type: configService.get<'sqlite'>('DB_TYPE') as 'sqlite', // Get database type from .env
      database: configService.get<string>('DB_NAME'), // Get database name from .env
      entities: [MessagesEntity, User], // Register entities
      synchronize: true, // Auto-sync database schema (set to false in production)
    };
  },
})
```

**How It Works**:
1. `inject: [ConfigService]` tells NestJS to provide `ConfigService` to the factory function
2. `useFactory` receives `configService` as a parameter
3. Configuration values are read from the environment file at runtime
4. TypeORM is configured with the fetched values

**Benefits**:
- Database connection can be changed without modifying code
- Different databases for development/testing/production
- Sensitive information stays in `.env` files (not in version control)

### Dependency Injection with ConfigService

ConfigService can be injected into any service or controller:

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getConfig() {
    const dbName = this.configService.get<string>('DB_NAME');
    const dbType = this.configService.get<string>('DB_TYPE');
    return { dbName, dbType };
  }
}
```

### Async Factory Pattern for Module Configuration

The `forRootAsync()` pattern combined with `inject` is used for modules that need configuration before initialization:

```typescript
Module.forRootAsync({
  inject: [ConfigService], // Dependency to inject
  useFactory: (configService: ConfigService) => {
    // Factory function receives injected dependencies
    // Returns configuration object synchronously or as a Promise
    return {
      // Configuration derived from environment
    };
  },
})
```

**This pattern is used for**:
- `TypeOrmModule.forRootAsync()` - Database configuration
- Custom services that need environment-based setup

### Configuration Access Flow

```
1. Application Starts
         ↓
2. Check NODE_ENV environment variable
         ↓
3. ConfigModule.forRoot() Executes
   - Determines environment file (.env.development, .env.test, etc.)
         ↓
4. .env File is Loaded
   - Environment variables are parsed
         ↓
5. ConfigService Becomes Available
   - Global service with all environment variables
         ↓
6. Modules Use ConfigService
   - TypeOrmModule, other services, controllers access values
         ↓
7. Application Configured Dynamically
   - Each environment uses appropriate settings
```

### Setting NODE_ENV in Different Contexts

**Development**:
```bash
# Automatically uses .env.development
npm run start
```

**Testing**:
```bash
# Uses .env.test
NODE_ENV=test npm test
```

**Production**:
```bash
# Uses .env.production
NODE_ENV=production npm run start:prod
```

### Best Practices for ConfigService

1. **Use Environment Files**: Always use `.env.*` files for configuration, never hardcode values
2. **Add to .gitignore**: Ensure all `.env` files are in `.gitignore` to prevent committing sensitive data
   ```
   .env
   .env.*
   .env.local
   .env.*.local
   ```

3. **Provide Defaults**: Use `get()` with a default value for optional configuration
   ```typescript
   const port = configService.get<number>('PORT', 3000);
   ```

4. **Type Safety**: Always specify the type parameter in `get()` for type checking
   ```typescript
   // Good
   configService.get<string>('DB_NAME')
   
   // Avoid
   configService.get('DB_NAME')
   ```

5. **Centralize Configuration**: Create a dedicated configuration service to aggregate environment-based settings
   ```typescript
   @Injectable()
   export class ConfigurationService {
     constructor(private configService: ConfigService) {}
     
     getDatabaseConfig() {
       return {
         type: this.configService.get<string>('DB_TYPE'),
         database: this.configService.get<string>('DB_NAME'),
       };
     }
   }
   ```

6. **Document Environment Variables**: Maintain a list of all required environment variables in a template file
   ```
   .env.example:
   DB_NAME=db.sqlite
   DB_TYPE=sqlite
   PORT=3000
   ```

7. **Validate on Startup**: Use `@nestjs/config` with schema validation to ensure required variables exist:
   ```typescript
   ConfigModule.forRoot({
     isGlobal: true,
     envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
     validationSchema: Joi.object({
       DB_TYPE: Joi.string().required(),
       DB_NAME: Joi.string().required(),
     }),
   })
   ```

### Common Configuration Patterns in This Project

**Pattern 1: Environment-Specific Database Setup**
- Uses `NODE_ENV` to determine which `.env` file to load
- TypeORM gets different database files based on environment
- Prevents test database interference with development data

**Pattern 2: Global Availability**
- `isGlobal: true` makes ConfigService available everywhere
- No need to import ConfigModule in every module
- Simplified dependency injection across the application

**Pattern 3: Async Factory Configuration**
- `forRootAsync()` + `useFactory` pattern
- Allows ConfigService to be used during module initialization
- Enables dynamic configuration before other services start

### Environment Variable Naming Convention

Use UPPERCASE_WITH_UNDERSCORES for environment variable names:
- `DB_NAME` - Database name
- `DB_TYPE` - Database type
- `PORT` - Application port
- `LOG_LEVEL` - Logging level
- `JWT_SECRET` - JWT secret key
- `NODE_ENV` - Node environment (development/test/production)

### Summary

ConfigService provides a clean, centralized way to manage environment-specific configuration. It separates concerns, improves security, and enables the same codebase to run in different environments with different settings. By using the async factory pattern with dependency injection, the application can dynamically configure complex modules like TypeORM based on environment variables loaded at startup.

## TypeORM Relationships: @ManyToOne and @OneToMany

TypeORM relationships allow you to model complex database relationships and automatically manage foreign keys and data integrity. This section explains one-to-many and many-to-one relationships implemented in this project.

### What are Database Relationships?

Database relationships define how data in different tables/entities relates to each other:
- **One-to-Many**: One record in a table can have multiple related records in another table
- **Many-to-One**: Multiple records in one table can relate to a single record in another table

These are two sides of the same relationship - just viewed from different perspectives.

### Why Use Relationships?

1. **Data Integrity**: Enforce that related data exists (foreign key constraints)
2. **Query Optimization**: Load related data efficiently with eager/lazy loading
3. **Automatic Management**: TypeORM handles foreign keys automatically
4. **Type Safety**: Access related entities as typed objects, not raw IDs
5. **Code Organization**: Better represents real-world entities and their connections
6. **Consistency**: Ensures only valid relationships exist (e.g., message must belong to a user)

### Project Relationship: User Has Many Messages

The application models a **one-to-many** relationship between Users and Messages:
- **One User** → **Many Messages** (A user can create multiple messages)
- **Many Messages** → **One User** (Each message belongs to exactly one user)

#### User Entity (One Side)

**Location**: `src/users/users.entity.ts`

```typescript
import { OneToMany, Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { MessagesEntity } from "src/messages/messages.entity";

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    // One user has many messages
    @OneToMany(() => MessagesEntity, message => message.user)
    messages: MessagesEntity[];
}
```

**Key Points**:
- `@OneToMany()` declares that one User can have many Messages
- First parameter `() => MessagesEntity`: The related entity type
- Second parameter `message => message.user`: The field in MessagesEntity that points back to User
- `messages: MessagesEntity[]`: Array of related Message entities
- **Important**: This field is NOT stored in the database; it's a virtual property for loading related data

#### Messages Entity (Many Side)

**Location**: `src/messages/messages.entity.ts`

```typescript
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { User } from "../users/users.entity";

@Entity()
export class MessagesEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    content: string;

    // Many messages belong to one user
    @ManyToOne(() => User, user => user.messages)
    user: User;
}
```

**Key Points**:
- `@ManyToOne()` declares that many Messages belong to one User
- First parameter `() => User`: The related entity type
- Second parameter `user => user.messages`: The inverse side of the relationship
- `user: User`: The actual related User object
- **Important**: This field creates the foreign key in the database (stores user ID)

### How TypeORM Stores This Relationship

**Database Structure**:

```
Users Table:
├── id (UUID)
├── email
└── password

Messages Table:
├── id (UUID)
├── content
└── userId (Foreign Key → Users.id)
```

TypeORM automatically:
1. Creates the `userId` column in the `messages` table
2. Adds a foreign key constraint linking `messages.userId` to `users.id`
3. Manages data consistency when users are deleted

### Using Relationships in Code

#### 1. Creating Related Data

```typescript
// Create a user first
const user = await usersService.createUser('user@example.com', 'hashedPassword');

// Messages are created with user reference
const message = await messagesService.create({
    content: 'Hello World',
    user: user  // Assign the User object
});
```

#### 2. Querying with Relations

**Eager Loading** (Load user with every message):
```typescript
// Get messages with their associated user
const messages = await messagesRepository.find({
    relations: ['user']  // Load related user data
});

// Now you can access: messages[0].user.email
console.log(messages[0].user.email);  // 'user@example.com'
```

**Lazy Loading** (Load user only when accessed):
```typescript
// Get messages without user data
const messages = await messagesRepository.find();

// User is a lazy-loaded Promise
const user = await messages[0].user;  // Loads user on demand
```

**Finding by User**:
```typescript
// Find all messages from a specific user
const userMessages = await messagesRepository.find({
    where: { user: { id: userId } },
    relations: ['user']
});
```

#### 3. Deleting Related Data

**Cascade Delete** (Optional):
If configured, deleting a user can automatically delete their messages:
```typescript
@OneToMany(() => MessagesEntity, message => message.user, {
    cascade: true  // Delete messages when user is deleted
})
messages: MessagesEntity[];
```

**Manual Delete**:
```typescript
// Delete messages first
await messagesRepository.delete({ user: { id: userId } });

// Then delete the user
await usersRepository.remove(user);
```

### Relationship Decorator Syntax

#### @OneToMany Syntax

```typescript
@OneToMany(
    () => RelatedEntity,           // Type of related entity
    relatedEntity => relatedEntity.parentField,  // Inverse field
    {
        cascade: true,             // Optional: auto-delete related data
        eager: true,               // Optional: always load related data
        lazy: false,               // Optional: lazy-load related data
    }
)
propertyName: RelatedEntity[];
```

#### @ManyToOne Syntax

```typescript
@ManyToOne(
    () => ParentEntity,            // Type of parent entity
    parentEntity => parentEntity.childrenField,  // Inverse field
    {
        eager: true,               // Optional: always load parent
        nullable: false,           // Optional: parent is required
    }
)
propertyName: ParentEntity;
```

### Relationship Loading Strategies

#### 1. **Eager Loading** (Always Load)

```typescript
@OneToMany(() => MessagesEntity, message => message.user, {
    eager: true  // Messages always loaded with User
})
messages: MessagesEntity[];
```

**Pros**: Always have related data; simpler code
**Cons**: Performance impact; always loads data even if not needed

#### 2. **Lazy Loading** (Load On Demand)

```typescript
@ManyToOne(() => User, user => user.messages)
user: Promise<User>;  // Returns a Promise
```

**Pros**: Better performance; only load when needed
**Cons**: Need to await; more complex code

#### 3. **QueryBuilder** (Explicit Control)

```typescript
const messages = await messagesRepository
    .createQueryBuilder('message')
    .leftJoinAndSelect('message.user', 'user')  // Explicitly join and load
    .where('user.id = :userId', { userId })
    .getMany();
```

**Pros**: Full control; optimize exactly what's needed
**Cons**: More verbose code

### Common Relationship Patterns

#### Pattern 1: Load Parent with All Children

```typescript
const user = await usersRepository.findOne({
    where: { id: userId },
    relations: ['messages']  // Load all messages for this user
});

// Access messages
console.log(user.messages);  // Array of MessagesEntity
```

#### Pattern 2: Filter Related Data

```typescript
// Find user with only recent messages (not supported directly in find())
// Use QueryBuilder instead:
const user = await usersRepository
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.messages', 'messages',
        'messages.createdAt > :date',
        { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    )
    .where('user.id = :id', { id: userId })
    .getOne();
```

#### Pattern 3: Count Related Data

```typescript
const stats = await usersRepository
    .createQueryBuilder('user')
    .loadRelationIds()  // Load IDs instead of full objects
    .where('user.id = :id', { id: userId })
    .getOne();
```

### Cascade Options

Cascade options automatically perform operations on related data:

```typescript
@OneToMany(() => MessagesEntity, message => message.user, {
    cascade: ['insert', 'update', 'remove']  // Auto-handle all operations
})
messages: MessagesEntity[];
```

**Options**:
- `cascade: ['insert']` - Auto-insert related data
- `cascade: ['update']` - Auto-update related data
- `cascade: ['remove']` - Auto-delete related data
- `cascade: true` - Enable all cascades
- `cascade: false` - No cascading (default)

**Warning**: Use cascade with caution as it can have unexpected consequences (e.g., deleting a user could delete all messages).

### Foreign Key Constraints

TypeORM automatically creates foreign keys that ensure data integrity:

**Constraint Rules**:
1. **Referential Integrity**: Cannot create a message without a valid user
2. **On Delete Cascade** (if enabled): Deleting a user deletes all their messages
3. **On Delete Restrict**: Cannot delete a user if they have messages (must delete messages first)

**Example Constraint SQL**:
```sql
ALTER TABLE messages
ADD CONSTRAINT FK_messages_user FOREIGN KEY (userId)
REFERENCES users(id) ON DELETE CASCADE;
```

### Common Issues and Solutions

**Issue 1: Circular Reference in Response**
```
Problem: User → messages → user → messages... (infinite loop)
Solution: Use DTOs and @Serialize() decorator to exclude relations
```

**Issue 2: N+1 Query Problem**
```
Problem: Loading 100 users, then looping and loading each user's messages (101 queries)
Solution: Use eager loading or QueryBuilder with joins
```

```typescript
// Bad (N+1): 101 queries
const users = await usersRepository.find();
users.forEach(user => {
    const messages = user.messages;  // Each triggers a query
});

// Good: 1 query
const users = await usersRepository.find({
    relations: ['messages']
});
```

**Issue 3: Large Data Sets**
```
Problem: Loading millions of messages with their users causes memory issues
Solution: Use pagination and selective loading
```

```typescript
// Paginated load
const messages = await messagesRepository.find({
    relations: ['user'],
    skip: 0,
    take: 50  // Load only 50 at a time
});
```

### Summary

- **@OneToMany** marks the "one" side of a one-to-many relationship (User can have many Messages)
- **@ManyToOne** marks the "many" side and stores the actual foreign key (Message belongs to one User)
- Relationships enable type-safe, automatic management of related data
- Use QueryBuilder for complex queries with multiple joins and filters
- Consider performance implications of eager vs lazy loading
- Use DTOs and serialization to prevent circular references in API responses
- Always handle cascade operations carefully to avoid unintended data loss

## Evolution of Global Configuration: Old vs New Approach

The application has evolved from a traditional approach of configuring global validation pipes and middleware in `main.ts` to a more modular approach in `AppModule`. This section explains both methods, their trade-offs, and why the new approach was adopted.

### The Old Approach: Configuration in main.ts

**Location**: `src/main.ts` (commented out in current codebase)

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Old way: Configure cookie-session middleware
  const cookieSession = require('cookie-session');
  app.use(
    cookieSession({
      keys: ['mysecretkey'],
      maxAge: 24 * 60 * 60 * 1000,
    }),
  );

  // Old way: Apply global validation pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

**Characteristics**:
- Direct imperative configuration
- Easily visible what's being configured globally
- All setup code in one central place
- Uses app instance methods (`app.use()`, `app.useGlobalPipes()`)

### The New Approach: Configuration in AppModule

**Location**: `src/app.module.ts`

```typescript
import { Module, MiddlewareConsumer, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
const cookieSession = require('cookie-session');

@Module({
  providers: [
    AppService,
    // New way: Register global validation pipe via provider
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule {
  // New way: Configure middleware using configure() method
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(
      cookieSession({
        keys: ['mysecretkey'],
        maxAge: 24 * 60 * 60 * 1000,
      })
    ).forRoutes('*');
  }
}
```

**Characteristics**:
- Declarative configuration through providers and middleware consumer
- Integrated into NestJS dependency injection system
- Configuration part of module structure
- Uses NestJS-specific patterns (`APP_PIPE`, `MiddlewareConsumer`)

### Side-by-Side Comparison

| Aspect | Old Approach (main.ts) | New Approach (AppModule) |
|--------|----------------------|------------------------|
| **Location** | `src/main.ts` | `src/app.module.ts` |
| **Configuration Style** | Imperative (procedural) | Declarative (module-based) |
| **Dependency Injection** | Not part of DI system | Integrated with DI system |
| **Token** | N/A | `APP_PIPE`, `APP_FILTER`, etc. |
| **Middleware Method** | `app.use()` | `configure()` method |
| **Global Pipes Method** | `app.useGlobalPipes()` | Provider with `APP_PIPE` token |
| **Global Filters Method** | `app.useGlobalFilters()` | Provider with `APP_FILTER` token |
| **Global Guards Method** | `app.useGlobalGuards()` | Provider with `APP_GUARD` token |
| **Testing Ease** | Harder to test in isolation | Easier to override in tests |
| **Module Coupling** | Tight coupling in bootstrap | Loose coupling via DI |
| **Code Organization** | Configuration separate from modules | Configuration with related modules |

### Why the New Approach?

#### 1. **Dependency Injection Integration**

The new approach leverages NestJS's dependency injection system:

```typescript
// Old way: Not part of DI
app.useGlobalPipes(new ValidationPipe({ ... }));

// New way: Part of DI system
{
  provide: APP_PIPE,
  useValue: new ValidationPipe({ ... }),
}
```

With DI integration, you can:
- Override pipes in tests with different implementations
- Inject dependencies into the ValidationPipe if needed
- Use factories for dynamic configuration

#### 2. **Testability**

The new approach makes testing significantly easier:

```typescript
// Test Module Override
@Module({
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: false,  // Disable for testing
      }),
    },
  ],
})
export class TestAppModule {}

// E2E Test
describe('AppModule', () => {
  let app: INestApplication;

  beforeEach(async () {
    const moduleFixture = Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should work with test configuration', () => {
    // test code
  });
});
```

#### 3. **Module Cohesion**

Configuration stays with related modules:

```typescript
// Before: Configuration scattered
// main.ts has validation pipes and middleware config
// app.module.ts has business logic

// After: Configuration with modules
// UsersModule has validation and middleware it uses
// AppModule has global configuration

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: MyCustomValidationPipe,
    },
  ],
})
export class UsersModule {}
```

#### 4. **Extensibility**

New approach allows using different token providers:

```typescript
// Register multiple pipes
{
  provide: APP_PIPE,
  useClass: ValidationPipe,
  multi: true,  // Allows multiple registrations
}
```

#### 5. **Middleware Consistency**

Using `configure()` method keeps middleware registration consistent with NestJS patterns:

```typescript
// All middleware registration in one place with clear routes
configure(consumer: MiddlewareConsumer) {
  consumer
    .apply(AuthMiddleware)
    .forRoutes('api/*');  // Clear route specificity
  
  consumer
    .apply(LoggerMiddleware)
    .forRoutes('*');      // Apply to all routes
}
```

### Special Tokens for Global Configuration

NestJS provides special tokens for different types of global configuration:

```typescript
import { APP_PIPE, APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  providers: [
    // Global Pipe
    {
      provide: APP_PIPE,
      useClass: MyValidationPipe,
    },
    
    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: MyExceptionFilter,
    },
    
    // Global Guard
    {
      provide: APP_GUARD,
      useClass: MyGuard,
    },
    
    // Global Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: MyInterceptor,
    },
  ],
})
export class AppModule {}
```

**Benefits**:
- Consistent pattern for all global features
- All configuration in one place (AppModule)
- Easier to manage and override in tests
- Better IDE support and refactoring

### When to Use Each Approach

**Use Old Approach (main.ts) for**:
- Quick prototyping
- Simple applications without testing requirements
- Configuration that must happen after app creation
- Third-party Express middleware setup

**Use New Approach (AppModule) for**:
- Production applications
- Applications with comprehensive test suites
- Complex modular applications
- When you need to override configuration in tests
- Enterprise applications requiring flexibility

### Migration Guide: Converting Old to New

**Step 1: Move Validation Pipe to AppModule**

```typescript
// Before (main.ts)
app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

// After (app.module.ts)
providers: [
  {
    provide: APP_PIPE,
    useValue: new ValidationPipe({ whitelist: true }),
  },
]
```

**Step 2: Move Exception Filter to AppModule**

```typescript
// Before (main.ts)
app.useGlobalFilters(new HttpExceptionFilter());

// After (app.module.ts)
providers: [
  {
    provide: APP_FILTER,
    useClass: HttpExceptionFilter,
  },
]
```

**Step 3: Move Middleware to configure() Method**

```typescript
// Before (main.ts)
app.use(cookieSession({ keys: ['secret'] }));

// After (app.module.ts)
configure(consumer: MiddlewareConsumer) {
  consumer.apply(cookieSession({ keys: ['secret'] })).forRoutes('*');
}
```

**Step 4: Simplify main.ts**

```typescript
// After migration - main.ts becomes minimal
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

### Project Implementation

**In this project**:
- ValidationPipe is registered via `APP_PIPE` token in AppModule providers
- Middleware (cookie-session) is configured using `configure()` method
- HttpExceptionFilter is still applied in main.ts (can be migrated to use `APP_FILTER` for full consistency)
- Commented-out code in main.ts shows the old approach for reference

**Code snippet from app.module.ts**:
```typescript
providers: [
  AppService,
  // Register a global validation pipe for request data validation
  {
    provide: APP_PIPE,
    useValue: new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  },
]

// Configure middleware using the configure method
configure(consumer: MiddlewareConsumer) {
  consumer.apply(
    cookieSession({
      keys: ['mysecretkey'],
      // maxAge: 24 * 60 * 60 * 1000,
    })
  ).forRoutes('*');
}
```

### Summary

The shift from `main.ts` configuration to `AppModule` configuration represents a move toward more modular, testable, and maintainable NestJS applications. While the old approach is simpler for small projects, the new approach scales better and integrates more deeply with NestJS's design philosophy. The current project uses the new approach for validation pipes and middleware, providing a solid foundation for testing and extensibility.

**Key Takeaways**:
- New approach integrates with NestJS dependency injection
- Significantly improves testability and override capabilities
- Keeps configuration with related modules
- Uses special tokens (`APP_PIPE`, `APP_FILTER`, etc.) consistently
- Better for production applications and large teams
- Old approach still valid for simple projects or quick prototypes
