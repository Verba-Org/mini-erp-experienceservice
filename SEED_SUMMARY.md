# Seed Data System Summary

## Created Files

### 1. Seed Service

**File**: `src/seed/seed.service.ts`

- Manages database seeding logic
- Injects repositories for Organization, Product, and Party entities
- Creates 2 organizations with sample data
- Creates 6 products (3 per organization)
- Creates 6 parties (3 per organization)
- Uses idempotent check to prevent duplicate seeding

**Key Methods**:

- `seed()` - Main seeding method called on application startup

### 2. Seed Module

**File**: `src/seed/seed.module.ts`

- NestJS module that encapsulates seeding functionality
- Implements `OnModuleInit` lifecycle hook
- Automatically triggers seeding when module initializes
- Registers TypeORM features for Organization, Product, Party

### 3. Mock Data

#### Organizations (2)

- **TechCorp Solutions** (Canada, Tax ID: TC-12345678)
- **Global Enterprises India** (India, Tax ID: 27AABCT1234H1Z0)

#### Products (6 total)

**TechCorp Solutions:**

- Laptop Pro 15 ($1,299.99, 50 in stock)
- Wireless Mouse ($29.99, 200 in stock)
- USB-C Cable 2m ($12.99, 500 in stock)

**Global Enterprises India:**

- Server CPU ($899.99, 30 in stock)
- RAM Module 32GB ($249.99, 100 in stock)
- SSD 1TB ($149.99, 150 in stock)

#### Parties (6 total)

**TechCorp Solutions:**

- Acme Corp (CUSTOMER)
- Global Suppliers Ltd (VENDOR)
- TechHub Resellers (CUSTOMER)

**Global Enterprises India:**

- Infosys Limited (CUSTOMER)
- Bharat Electronics (VENDOR)
- TCS Supply Chain (VENDOR)

## Configuration Changes

### AppModule Updates (`src/app.module.ts`)

1. Added imports for all entities (Organization, Product, Party, Invoice, InvoiceItem)
2. Added SeedModule to the imports array
3. Updated TypeOrmModule entities list to include all 7 entities
4. SeedService is now available globally

## How It Works

1. **Application Start**: NestJS bootstraps the application
2. **Module Initialization**: AppModule initializes all modules including SeedModule
3. **OnModuleInit Hook**: SeedModule's `onModuleInit()` is triggered
4. **Seeding Check**: SeedService checks if data already exists
5. **Data Creation**: If no data exists, creates all organizations, products, and parties
6. **Logging**: Logs seeding progress to console
7. **Application Ready**: Application is ready to use with seeded data

## Running the Application

### Development with Seed Data

```bash
npm run start:dev
```

**Console Output**:

```
[SeedService] Starting database seeding...
[SeedService] Created 2 organizations
[SeedService] Created 6 products
[SeedService] Created 6 parties
[SeedService] Database seeding completed successfully!
```

### Production Build

```bash
npm run build
npm run start:prod
```

## Key Features

✅ **Automatic on Startup**: No manual intervention needed  
✅ **Idempotent**: Won't create duplicates on restart  
✅ **Logged**: Clear console output shows seeding progress  
✅ **Environment Aware**: Works with dev, test, and production  
✅ **Relationship Support**: Maintains referential integrity  
✅ **Easy to Modify**: Seed data is centralized in one service

## Next Steps

To add more seed data or modify existing:

1. Edit `src/seed/seed.service.ts`
2. Add or modify seed data in the `seed()` method
3. Delete the database file (`db.sqlite` or `test.sqlite`)
4. Restart the application

For more detailed information, see [SEEDING.md](./SEEDING.md)
