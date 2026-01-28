# Database Seeding Guide

## Overview

The Mini ERP Experience Service includes an automated database seeding system that loads mock data for `Product`, `Organization`, and `Party` entities on application startup. This seeding system ensures that the database has sample data for testing and development purposes.

## Architecture

### Components

1. **SeedModule** (`src/seed/seed.module.ts`)
   - NestJS module that manages seeding
   - Implements `OnModuleInit` lifecycle hook
   - Automatically triggers seeding when the application starts

2. **SeedService** (`src/seed/seed.service.ts`)
   - Contains the logic for seeding data
   - Uses TypeORM repositories to manage entities
   - Checks if data already exists to prevent duplicate seeding

3. **Entities**
   - `Organization` - Parent entity representing organizations/companies
   - `Product` - Products belonging to organizations
   - `Party` - Customers/Vendors belonging to organizations

## How It Works

### Startup Flow

```
Application Start
       ↓
AppModule Initialization
       ↓
SeedModule Imports
       ↓
OnModuleInit Hook Triggered
       ↓
SeedService.seed() Executed
       ↓
Check if data exists (organizationRepository.count())
       ↓
If count === 0: Create and insert seed data
If count > 0: Skip seeding (log: "Database already seeded")
       ↓
Application Ready
```

### Seeding Process

1. **Organization Creation**
   - Creates 2 organizations:
     - TechCorp Solutions (Canada)
     - Global Enterprises India (India)

2. **Product Creation**
   - Creates 3 products per organization (6 total):
     - TechCorp: Laptop Pro 15, Wireless Mouse, USB-C Cable 2m
     - Global Enterprises: Server CPU, RAM Module 32GB, SSD 1TB

3. **Party Creation**
   - Creates 3 parties per organization (6 total):
     - TechCorp: Acme Corp (CUSTOMER), Global Suppliers Ltd (VENDOR), TechHub Resellers (CUSTOMER)
     - Global Enterprises: Infosys Limited (CUSTOMER), Bharat Electronics (VENDOR), TCS Supply Chain (VENDOR)

## Mock Data Details

### Organizations

| Name                     | Country | Tax ID          |
| ------------------------ | ------- | --------------- |
| TechCorp Solutions       | CA      | TC-12345678     |
| Global Enterprises India | IN      | 27AABCT1234H1Z0 |

### Products (TechCorp Solutions)

| Name           | Unit Price | Stock |
| -------------- | ---------- | ----- |
| Laptop Pro 15  | $1,299.99  | 50    |
| Wireless Mouse | $29.99     | 200   |
| USB-C Cable 2m | $12.99     | 500   |

### Products (Global Enterprises India)

| Name            | Unit Price | Stock |
| --------------- | ---------- | ----- |
| Server CPU      | $899.99    | 30    |
| RAM Module 32GB | $249.99    | 100   |
| SSD 1TB         | $149.99    | 150   |

### Parties (TechCorp Solutions)

| Name                 | Type     | Phone        |
| -------------------- | -------- | ------------ |
| Acme Corp            | CUSTOMER | 416-555-0123 |
| Global Suppliers Ltd | VENDOR   | 416-555-0124 |
| TechHub Resellers    | CUSTOMER | 416-555-0125 |

### Parties (Global Enterprises India)

| Name               | Type     | Phone            |
| ------------------ | -------- | ---------------- |
| Infosys Limited    | CUSTOMER | +91-80-4156-0000 |
| Bharat Electronics | VENDOR   | +91-11-4155-1234 |
| TCS Supply Chain   | VENDOR   | +91-22-6178-2000 |

## Database Relationships

```
Organization
    ├── Products (1-to-Many)
    ├── Parties (1-to-Many)
    └── Invoices (1-to-Many)

Product
    └── Organization (Many-to-One)

Party
    └── Organization (Many-to-One)
```

## Configuration

### Environment Variables

The seeding system respects the following environment variables:

- `NODE_ENV` - Determines which `.env` file to load (development, test, production)
- `DB_NAME` - Database file name (e.g., `db.sqlite`)
- `DB_TYPE` - Database type (e.g., `sqlite`)

### .env Files

#### .env.development

```
DB_TYPE=sqlite
DB_NAME=db.sqlite
REJECT_UNAUTHORIZED=false
```

#### .env.test

```
DB_TYPE=sqlite
DB_NAME=test.sqlite
```

## Running the Application

### Development Mode

```bash
npm run start:dev
```

- Watches for file changes
- Loads `.env.development`
- Seeds database on startup
- Logs seeding progress to console

### Production Mode

```bash
npm run build
npm run start:prod
```

- Loads `.env.production` (if it exists)
- Seeds database on first run
- Logs seeding progress to console

### Testing

```bash
npm test
```

- Loads `.env.test`
- Each test run seeds the `test.sqlite` database

## Logs

When the application starts, you'll see seeding logs in the console:

```
[SeedService] Starting database seeding...
[SeedService] Created 2 organizations
[SeedService] Created 6 products
[SeedService] Created 6 parties
[SeedService] Database seeding completed successfully!
```

Or if data already exists:

```
[SeedService] Database already seeded. Skipping...
```

## Idempotency

The seeding system is **idempotent** - it checks if data already exists before seeding:

```typescript
const organizationCount = await this.organizationRepository.count();

if (organizationCount === 0) {
  // Seed data
} else {
  this.logger.log('Database already seeded. Skipping...');
}
```

This means:

- First run: Seeds database
- Subsequent runs: Skips seeding
- Manual database wipe: Next run seeds again
- Safe for multiple environment restarts

## Modifying Seed Data

To add or modify mock data:

1. Edit `/src/seed/seed.service.ts`
2. Update the seed data in the `seed()` method:

```typescript
// Example: Add new product
const products = [
  {
    org_id: savedOrg1.id,
    name: 'New Product',
    unit_price: 99.99,
    current_stock: 100,
    organization: savedOrg1,
  },
];
```

3. Clear the database (delete `db.sqlite` or `test.sqlite`)
4. Restart the application
5. New seed data will be loaded

## API Endpoints to Test Seeded Data

### Get All Organizations

```bash
curl http://localhost:3000/organizations
```

### Get Organization Products

```bash
curl http://localhost:3000/organizations/{org_id}/products
```

### Get Organization Parties

```bash
curl http://localhost:3000/organizations/{org_id}/parties
```

## Troubleshooting

### Seeding Not Working

1. **Check if entities are registered in AppModule**

   ```typescript
   // app.module.ts should include:
   entities: [
     MessagesEntity,
     User,
     Organization,
     Product,
     Party,
     Invoice,
     InvoiceItem,
   ];
   ```

2. **Verify SeedModule is imported in AppModule**

   ```typescript
   imports: [
     // ... other imports
     SeedModule,
   ];
   ```

3. **Check database file permissions**
   - Ensure write permissions for database directory
   - For SQLite, the directory needs write access

4. **Verify environment variables**
   - Check `.env.development` or `.env.test` exists
   - Verify `DB_TYPE` and `DB_NAME` are set correctly

5. **Check logs**
   - Look for error messages in console during startup
   - Enable TypeORM logging for SQL statements: `logging: true`

### Duplicate Data Issues

If you see duplicate seeded data:

1. Delete the database file

   ```bash
   rm db.sqlite
   ```

2. Restart the application
   ```bash
   npm run start:dev
   ```

## Best Practices

1. **Use separate databases for different environments**
   - `db.sqlite` for development
   - `test.sqlite` for testing
   - Production database with seeding disabled

2. **Don't hardcode sensitive data**
   - Avoid storing real passwords or API keys
   - Use placeholder values for sensitive fields

3. **Keep seed data minimal**
   - Only include data necessary for testing
   - Avoid large datasets that slow startup

4. **Document seed data changes**
   - Update this guide when adding/removing seed data
   - Include rationale for changes

5. **Version control seed data**
   - Commit `seed.service.ts` to repository
   - Maintain consistency across team members

## Future Enhancements

Possible improvements to the seeding system:

1. **Separate seed files** - Create individual seed files for each entity
2. **Seed data factories** - Use libraries like `faker.js` for realistic data
3. **CLI commands** - Add `nest-cli` commands to reseed manually
4. **Environment-specific seeds** - Different data for dev/test/prod
5. **Seed data templates** - Support loading seeds from JSON/CSV files
