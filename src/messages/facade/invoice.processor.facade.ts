import { Injectable } from '@nestjs/common';
import { BrainClientSchema } from 'src/clients/schema/brain.client.schema';
import { Invoice } from '../entities/invoice.entity';
import { Party } from '../entities/party.entity';
import { Product } from '../entities/product.entity';
import { Organization } from '../entities/organization.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { InvoiceItem } from '../entities/invoice-item.entity';

export interface InvoiceProcessorFacade {
  processInvoice(invoiceData: BrainClientSchema): Promise<String>;
}

@Injectable()
export class InvoiceProcessorFacadeImpl implements InvoiceProcessorFacade {

constructor(
  @InjectRepository(Invoice) private invoiceRepository: Repository<Invoice>,
  @InjectRepository(Party) private partyRepository: Repository<Party>,
  @InjectRepository(Organization) private organizationRepository: Repository<Organization>,
    @InjectRepository(Product) private productRepository: Repository<Product>,
) {}

private readonly DEFAULT_CUSTOMER = 'Anonymous Traders';
private readonly DEFAULT_ORGANIZATION = 'Selmel Liquors';

  async processInvoice(invoiceData: BrainClientSchema): Promise<String> {
//     Ryan Wants 800 bottles of Kingfisher by Feb 1st. - CREATE_SALES_ORDER
        // Generate a entry in invoice table with status = 'PENDING' and generate an display message
        if (invoiceData.intent === 'CREATE_SALES_ORDER') {
          // Logic to create a sales order invoice
          try {
            const invoice = await this.__createInvoiceEntity(invoiceData);
            console.log(invoice);
            const storedInvoice = await this.invoiceRepository.save(invoice);
            // const storedInvoice = await this.invoiceRepository.findOneBy({ id: result.identifiers[0].id });
            console.log('Sales order invoice created with ID:', invoice.id);
            return `Created a Sales ORder with Order # ${storedInvoice?.display_number}. Use this Order number for further interactions`
          } catch (error) {
            console.error(error);
            // throw new Error('Error creating sales order invoice: ' + error.message);
            return `Issue creating order ${error.message}`
          }
        }
// Sold Ryan 800 bottles of Kingfisher for order <display message> - CREATE_FULLFILLMENT
        // Update the invoice status to 'DELIVERED'
        else if (invoiceData.intent === 'CREATE_FULLFILLMENT') {
          // Logic to update invoice status to DELIVERED
          console.log('Updating invoice status to DELIVERED...');
        }
// Generate invoice for order #101 for Ryan - CREATE_INVOICE
        // update the invoice status to 'INVOICED'
        else if (invoiceData.intent === 'CREATE_INVOICE') {
            // Logic to update invoice status to INVOICED
            console.log('Updating invoice status to INVOICED...');
            }

// Payment received for order #101 for Ryan - RECORD_PAYMENT
        // update the invoice status to 'PAID'
        else if (invoiceData.intent === 'RECORD_PAYMENT') {
            // Logic to update invoice status to PAID
            console.log('Updating invoice status to PAID...');
            }
        
        else if (invoiceData.intent === 'UNKNOWN') {
            console.log('Unknown intent received. No action taken.');
        }

        else if ( invoiceData.intent === 'CHECK_INVENTORY') {
            console.log('Inventory check requested. No invoice action taken.');
        }
    // console.log('Processing invoice data:', invoiceData);
    // return { status: 'processed', data: invoiceData };
    return `Functionality not implement`
  }

  async __createInvoiceEntity(data: BrainClientSchema): Promise<Invoice> {
    const invoice = new Invoice();
    // retrieve the highest invoice_number from the database and increment it
    const invoice_numer_max = await this.invoiceRepository.createQueryBuilder()
        .select("MAX(invoice.invoice_number)", "max")
        // .from(Invoice, "invoice")
        .getRawOne()
        // .then(result => {
        //     const maxInvoiceNumber = result.max || 0;
        //     invoice.invoice_number = maxInvoiceNumber + 1;
        // });
    const maxInvoiceNumber = invoice_numer_max.max || 0;
    invoice.invoice_number = maxInvoiceNumber + 1;
    invoice.intent = data.intent;
    invoice.status = 'PENDING';
    invoice.display_number = 'SO-'+invoice.invoice_number;
    
    invoice.due_date = data.due_date ? new Date(data.due_date) : null;
    invoice.created_at = new Date();
    
    // Check if party with the name exists, if the party with the name does not exist , retrieve party with name anonymous
    const party = await this.__getPartyByName(data.party_name || this.DEFAULT_CUSTOMER);
    // invoice.party = party!;
    // invoice.party = { id: party!.id } as Party
    invoice.partyId = party!.id;
        
    const organization = await this.__getOrganizationByName(this.DEFAULT_ORGANIZATION);
    // invoice.organization = organization!;
    invoice.org_id = organization!.id;
    // invoice.organization = { id: organization!.id } as Organization;
    const invoiceItems = await this.buildInviceItemList(data, invoice);
    if (invoiceItems) {
        invoice.items = invoiceItems;
    }
        
        // this.invoiceRepository.createQueryBuilder("invoice")
    //     .leftJoinAndSelect("invoice.party", "party")
    //     .where("party.name = :name", { name: data.party_name || 'Anonymous' })
    

    return invoice;
  }

  async buildInviceItemList(data: BrainClientSchema, invoice: Invoice): Promise<InvoiceItem[] | null> {
    if (!data.line_items || data.line_items.length === 0) {
        return null;
    }
    
    const lineItems = data.line_items;
    const invoiceItems = await Promise.all(lineItems.map(async (item) => {
        const invoiceItem : InvoiceItem = new InvoiceItem();
        const product = await this.__getProductByName(item.product_name);
        if(!product) {
            throw new Error(`Product with name ${item.product_name} not found. Please send correct product name.`);
        }
        // invoiceItem.product = product!;
        // invoiceItem.product ={ id: product!.id } as Product;
        invoiceItem.productId = product.id;

        invoiceItem.quantity = item.product_quantity;
        // invoiceItem.unit_price = item.unit_price; // Uncomment if unit_price is added to InvoiceItem entity
        invoiceItem.description = item.product_name;
        invoiceItem.invoice = invoice
        return invoiceItem;
    }));

    console.log('Built Invoice Items:', invoiceItems);
    return invoiceItems;
    
    
  }


  async __getProductByName(name: string): Promise<Product | null> {
    // Placeholder for product lookup logic
    return await this.productRepository.findOne({ where: { name } });
  }

  async __getPartyByName(name: string): Promise<Party | null> {
    // if party is not found, search party with name 'Anonymous'
    const party  = await this.partyRepository.findOne({ where: { name } });
    if (!party) {
        console.warn(`Party with name ${name} not found.`);
        return await this.partyRepository.findOne({ where: { name : this.DEFAULT_CUSTOMER } });
    }
    return party;
  }
  
  async __getOrganizationByName(name: string): Promise<Organization | null> {
    const organization  = await this.organizationRepository.findOne({ where: { name } });
    if (!organization) {
        console.warn(`Organization with name ${name} not found.`);
        return null;
    }
    return organization;
  }
}