# Mini ERP Experience Service - AI Coding Instructions

## Project Overview

**Mini ERP Experience Service** is a NestJS-based REST API that serves as the "experience layer" for a mini ERP system. It receives WhatsApp messages via controllers, interprets intent through an external AI service (Brain Client), processes business operations (invoices, orders, customers), and persists data using TypeORM with SQLite.

**Key Data Flow**: WhatsApp message → MessagesController → BrainClientFacade (AI intent extraction) → InvoiceProcessorFacade (business logic) → TypeORM entities → SQLite

## Architecture Patterns

### Module Organization (Vertical Feature Slices)

NestJS modules organize code by feature domain: `UsersModule`, `MessagesModule`, `SeedModule`. Each module:

- **Imports**: TypeORM entity repositories + external dependencies (`HttpModule` for external API calls)
- **Controllers**: HTTP request handlers with route definitions and guards
- **Providers**: Services (business logic) and facades (cross-service orchestration)
- **Exports**: Make services available to other modules

See: [app.module.ts](src/app.module.ts) (root config), [messages.module.ts](src/messages/messages.module.ts)

### Service Layer with Facade Pattern

- **Services** (`messages.services.ts`, `users.service.ts`): Direct database CRUD via TypeORM repositories
- **Facades** (`invoice.processor.facade.ts`, `brain.client.facade.ts`): Orchestrate complex workflows combining multiple services; handle external API calls
- Facades return human-readable strings for user feedback (e.g., `"Order #101 created for Ryan"`)

See: [messages.services.ts](src/messages/messages.services.ts) → [invoice.processor.facade.ts](src/messages/facade/invoice.processor.facade.ts)

## Key Development Patterns

### Request Validation & Transformation

Use **DTOs with class-validator decorators** for all POST/PATCH bodies. TypeScript `emitDecoratorMetadata: true` in `tsconfig.json` enables runtime type reflection.

- Validation: `@IsString()`, `@IsNotEmpty()` decorators in DTO classes (e.g., [create-message.dtos.ts](src/messages/dtos/create-message.dtos.ts))
- Global ValidationPipe applies automatically to all requests (configured in [app.module.ts](src/app.module.ts) as APP_PIPE provider)

### Authentication & Authorization

- **AuthGuard**: Checks `request.session.userId` presence. Applied via `@UseGuards(AuthGuard)` decorator
- **AdminGuard**: Role-based access; stricter than AuthGuard
- **@CurrentUser() decorator**: Injects user from request object (custom param decorator in [current-user.decorator.ts](src/common/decorators/current-user.decorator.ts))

See: [messages.controller.ts](src/messages/messages.controller.ts) for usage patterns

### Response Serialization

Use **@Serialize(DtoClass) interceptor** on controller methods to expose only whitelisted properties (via `@Expose()` in DTOs). Prevents accidental data leaks (e.g., password fields).

See: [serialize.interceptors.ts](src/common/interceptors/serialize.interceptors.ts)

### Dependency Injection

- Use **@Injectable()** to mark classes as providers
- Inject via **constructor parameters** with `@InjectRepository()` for TypeORM repos
- ConfigService injected for environment variables (`process.env` fallback in code)

## Business Logic: Invoice Processing Workflow

**Intent-based processing**: BrainClientFacade sends WhatsApp content to external AI service, returns `BrainClientSchema` with intent field. InvoiceProcessorFacade dispatches on intent:

| Intent               | Action                                    | Status         |
| -------------------- | ----------------------------------------- | -------------- |
| `CREATE_SALES_ORDER` | Create Invoice entity with PENDING status | ✅ Implemented |
| `CREATE_FULFILLMENT` | Update Invoice status to DELIVERED        | ⏳ TODO        |
| `CREATE_INVOICE`     | Update Invoice status to INVOICED         | ⏳ TODO        |
| `RECORD_PAYMENT`     | Update Invoice status to PAID             | ⏳ TODO        |
| `CHECK_INVENTORY`    | Query Product inventory                   | ⏳ TODO        |
| `UNKNOWN`            | Log and ignore                            | ✅ Handled     |

Default customer: "Anonymous Traders" | Default organization: "Selmel Liquors"

See: [invoice.processor.facade.ts](src/messages/facade/invoice.processor.facade.ts#L32-L76)

## Database & Entities

**ORM**: TypeORM with SQLite (configured via ConfigService in [app.module.ts](src/app.module.ts))

**Core Entities** (auto-registered in TypeOrmModule.forFeature):

- `MessagesEntity`, `User` (message/user tracking)
- `Invoice`, `InvoiceItem` (sales orders & line items)
- `Party`, `Organization`, `Product` (master data)

Relationships: Invoice → Organization, Party, Products; InvoiceItem → Invoice

## External Integrations

### Brain Client (AI Intent Service)

- **Endpoint**: `http://localhost:8000/command/interpret`
- **Request**: `{ command: string, timestamp: string }`
- **Response**: `BrainClientSchema` with `intent` field
- **SSL**: Controlled by `REJECT_UNAUTHORIZED` env var (default: true)

See: [brain.client.facade.ts](src/clients/brain.client.facade.ts)

### Twilio (WhatsApp)

- Facade exists but currently unused ([whatsapp.twilio.facade.ts](src/clients/whatsapp.twilio.facade.ts))

## Environment & Running

**Dev**: `npm run start:dev` (watches TypeScript changes)
**Build**: `npm run build` → outputs to `dist/`
**Test**: `npm test` or `npm run test:watch`
**E2E**: `npm run test:e2e`

Environment variables loaded from `.env.{NODE_ENV}` files (e.g., `.env.development`, `.env.production`)

## Testing Notes

- Controllers use `@UseGuards()` and `@Serialize()` decorators → must mock in e2e tests
- ValidationPipe and global filters configured in AppModule (not main.ts) for testability
- Session/cookie-session middleware configured in AppModule for same reason

## Common Gotchas

1. **Partial TypeORM feature implementation**: CREATE_SALES_ORDER works; UPDATE operations (fulfillment, invoicing, payment) are TODO
2. **External AI service required**: Brain Client must be running at `localhost:8000` for message processing
3. **Facade return types**: Facades return `Promise<String>` (user-facing messages), not objects
4. **Entity hooks**: UsersService calls `save()` to trigger @BeforeInsert/@BeforeUpdate hooks; `.update()` bypasses them
