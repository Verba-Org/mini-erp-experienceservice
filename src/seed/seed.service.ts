import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../messages/entities/organization.entity';
import { Product } from '../messages/entities/product.entity';
import { Party } from '../messages/entities/party.entity';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Party)
    private partyRepository: Repository<Party>,
  ) {}

  async seed(): Promise<void> {
    try {
      const organizationCount = await this.organizationRepository.count();

      if (organizationCount === 0) {
        this.logger.log('Starting database seeding...');

        // Create Organizations
        const org1 = this.organizationRepository.create({
          name: 'Hemadri Solutions',
          country: 'IN',
          tax_id: '29AABCH1234E1Z2',
        });

        const org2 = this.organizationRepository.create({
          name: 'Selmel Liquors',
          country: 'IN',
          tax_id: '27AABCT1234H1Z0',
        });

        const savedOrg1 = await this.organizationRepository.save(org1);
        const savedOrg2 = await this.organizationRepository.save(org2);

        this.logger.log(`Created ${2} organizations`);

        // Create Products for Org 1
        const products1 = [
          {
            org_id: savedOrg2.id,
            name: 'kingfisher',
            unit_price: 150.0,
            current_stock: 50,
            organization: savedOrg2,
          },
          {
            org_id: savedOrg2.id,
            name: 'tuborg',
            unit_price: 130.0,
            current_stock: 200,
            organization: savedOrg2,
          },
          {
            org_id: savedOrg2.id,
            name: 'Heineken Lager',
            unit_price: 180.0,
            current_stock: 500,
            organization: savedOrg2,
          },
        ];

        // Create Products for Org 2
        const products2 = [
          {
            org_id: savedOrg2.id,
            name: 'Hayward 500 Larger',
            unit_price: 199.99,
            current_stock: 30,
            organization: savedOrg2,
          },
          {
            org_id: savedOrg2.id,
            name: 'Canadian Goose',
            unit_price: 249.99,
            current_stock: 100,
            organization: savedOrg2,
          },
          {
            org_id: savedOrg2.id,
            name: 'Malibu Rum',
            unit_price: 299.99,
            current_stock: 150,
            organization: savedOrg2,
          },
        ];

        await this.productRepository.save(products1);
        await this.productRepository.save(products2);

        this.logger.log(
          `Created ${products1.length + products2.length} products`,
        );

        // Create Parties for Org 1
        const parties1 = [
          {
            org_id: savedOrg2.id,
            name: 'Hilton Hotels India',
            type: 'CUSTOMER',
            phone: '416-555-0123',
            organization: savedOrg2,
          },
          {
            org_id: savedOrg2.id,
            name: 'Restaurant Supply Co.',
            type: 'VENDOR',
            phone: '416-555-0124',
            organization: savedOrg2,
          },
          {
            org_id: savedOrg2.id,
            name: 'Ryan',
            type: 'CUSTOMER',
            phone: '416-555-0125',
            organization: savedOrg2,
          },
        ];

        // Create Parties for Org 2
        const parties2 = [
          {
            org_id: savedOrg2.id,
            name: 'Anonymous Traders',
            type: 'CUSTOMER',
            phone: '+91-80-4156-0000',
            organization: savedOrg2,
          },
          {
            org_id: savedOrg2.id,
            name: 'Spencer & Co. Suppliers',
            type: 'VENDOR',
            phone: '+91-11-4155-1234',
            organization: savedOrg2,
          },
          {
            org_id: savedOrg2.id,
            name: 'Taj Hotels',
            type: 'VENDOR',
            phone: '+91-22-6178-2000',
            organization: savedOrg2,
          },
        ];

        await this.partyRepository.save(parties1);
        await this.partyRepository.save(parties2);

        this.logger.log(`Created ${parties1.length + parties2.length} parties`);

        this.logger.log('Database seeding completed successfully!');
      } else {
        this.logger.log('Database already seeded. Skipping...');
      }
    } catch (error) {
      this.logger.error(`Error during seeding: ${error.message}`, error.stack);
      throw error;
    }
  }
}
