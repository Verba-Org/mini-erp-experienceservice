import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Organization } from '../messages/entities/organization.entity';
import { Product } from '../messages/entities/product.entity';
import { Party } from '../messages/entities/party.entity';
import { TaxConfig } from 'src/messages/entities/tax-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, Product, Party, TaxConfig]),
  ],
  providers: [SeedService],
})
export class SeedModule implements OnModuleInit {
  constructor(private seedService: SeedService) {}

  async onModuleInit(): Promise<void> {
    // Seed database on application startup
    await this.seedService.seed();
  }
}
