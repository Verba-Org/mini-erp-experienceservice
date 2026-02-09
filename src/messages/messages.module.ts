import { TypeOrmModule } from '@nestjs/typeorm';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.services';
import { BrainClientFacade } from 'src/clients/brain.client.facade';
import { WhatsappTwilioFacade } from 'src/clients/whatsapp.twilio.facade';
import { HttpModule } from '@nestjs/axios';

import { MessagesEntity } from './messages.entity';
import { Invoice } from './entities/invoice.entity';
import { Organization } from './entities/organization.entity';
import { Party } from './entities/party.entity';
import { Product } from './entities/product.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { InvoiceProcessorFacadeImpl } from './facade/invoice.processor.facade';
import { WhatsappController } from './whatsapp.controller';
import { PdfGeneratorUtil } from 'src/common/utils/pdf.generator.util';
import { GoogleCloudStorageUtil } from 'src/common/utils/google-cloud-storage.util';
import { InvoiceLinkController } from './invoice.controller';
import { TaxConfig } from './entities/tax-config.entity';
import { TaxCalculator } from 'src/common/utils/tax-calculator-util';
import { UsersService } from 'src/users/users.service';
import { UsersModule } from 'src/users/users.module';
import { CurrentUserMiddleware } from 'src/common/middlewares/current-user.middleware';

// Module definition for Messages . Modules are used to organize related components, controllers, and services in a NestJS application.
@Module({
  // Auto-register the Message entity with TypeORM in this module and generate the necessary repository classes
  imports: [
    TypeOrmModule.forFeature([
      MessagesEntity,
      Invoice,
      InvoiceItem,
      Organization,
      Party,
      Product,
      TaxConfig,
    ]),
    HttpModule,
    UsersModule,
  ],

  // imports: [], // Used to import other modules.. specify the module names here
  controllers: [MessagesController, WhatsappController, InvoiceLinkController],
  // bean definitions in spring boot
  providers: [
    MessagesService,
    BrainClientFacade,
    InvoiceProcessorFacadeImpl,
    WhatsappTwilioFacade,
    PdfGeneratorUtil,
    GoogleCloudStorageUtil,
    TaxCalculator,
  ],
  exports: [MessagesService, TaxCalculator],
  // exports: [] // Used to make providers available outside this module to other modules
})
export class MessagesModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CurrentUserMiddleware).forRoutes('*'); // Apply to all routes in this module
  }
}
