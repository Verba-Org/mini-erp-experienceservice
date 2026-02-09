import { Injectable, Logger } from '@nestjs/common';
import { BrainClientSchema } from 'src/clients/schema/brain.client.schema';
import { Invoice } from '../entities/invoice.entity';
import { Party } from '../entities/party.entity';
import { Product } from '../entities/product.entity';
import { Organization } from '../entities/organization.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, In, Repository } from 'typeorm';
import { InvoiceItem } from '../entities/invoice-item.entity';
import { response } from 'express';
import { SimpleInvoiceData } from '../dtos/simple-invoice-data';
import { PdfGeneratorUtil } from 'src/common/utils/pdf.generator.util';
import * as fs from 'fs';
import * as path from 'path';
import { GoogleCloudStorageUtil } from 'src/common/utils/google-cloud-storage.util';
import { TaxCalculator } from 'src/common/utils/tax-calculator-util';
import { InvoiceResponse } from '../dtos/invoice-response';

export interface InvoiceProcessorFacade {
  processInvoice(invoiceData: BrainClientSchema): Promise<InvoiceResponse>;
}

interface TemplateMap {
  'simple-invoice-template': SimpleInvoiceData;
}

@Injectable()
export class InvoiceProcessorFacadeImpl implements InvoiceProcessorFacade {
  private readonly logger = new Logger(InvoiceProcessorFacadeImpl.name);
  private readonly INVOICES_DIR = path.join(process.cwd(), 'invoices');

  constructor(
    @InjectRepository(Invoice) private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Party) private partyRepository: Repository<Party>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Product) private productRepository: Repository<Product>,
    private datasource: DataSource,
    private pdfGeneratorUtil: PdfGeneratorUtil,
    private googleCloudStorageUtil: GoogleCloudStorageUtil,
    private taxCalculator: TaxCalculator,
  ) {
    this.ensureInvoicesDirectoryExists();
  }

  private ensureInvoicesDirectoryExists(): void {
    if (!fs.existsSync(this.INVOICES_DIR)) {
      fs.mkdirSync(this.INVOICES_DIR, { recursive: true });
      this.logger.log(`Created invoices directory at: ${this.INVOICES_DIR}`);
    }
  }

  private readonly DEFAULT_CUSTOMER = 'Anonymous Traders';
  private readonly DEFAULT_ORGANIZATION = 'Selmel Liquors';

  async processInvoice(
    invoiceData: BrainClientSchema,
  ): Promise<InvoiceResponse> {
    //     Ryan Wants 800 bottles of Kingfisher by Feb 1st. - CREATE_SALES_ORDER
    // Generate a entry in invoice table with status = 'PENDING' and generate an display message
    const invoiceResponse: InvoiceResponse = new InvoiceResponse();
    if (invoiceData.intent === 'CREATE_SALES_ORDER') {
      // Logic to create a sales order invoice
      try {
        const storedInvoice = await this.createInvoice(invoiceData);
        // const storedInvoice = await this.invoiceRepository.findOneBy({ id: result.identifiers[0].id });
        this.logger.log(
          'Sales order invoice created with ID:',
          storedInvoice.id,
        );

        invoiceResponse.display_so_number = storedInvoice.display_number!;
        invoiceResponse.responseStr = `Created a Sales Order with Order # ${storedInvoice?.display_number}. Use this Order number for further interactions`;
      } catch (error) {
        this.logger.error(error);
        // throw new Error('Error creating sales order invoice: ' + error.message);
        invoiceResponse.responseStr = `Issue creating order ${error.message}`;
      }
    }
    // Sold Ryan 800 bottles of Kingfisher for order <display message> - CREATE_FULLFILLMENT
    // Update the invoice status to 'DELIVERED'
    else if (invoiceData.intent === 'CREATE_FULLFILLMENT') {
      // Logic to update invoice status to DELIVERED
      this.logger.log('Updating invoice status to DELIVERED...');
      return await this.fullfillOrder(invoiceData);
    }
    // Generate invoice for order #101 for Ryan - CREATE_INVOICE
    // update the invoice status to 'INVOICED'
    else if (invoiceData.intent === 'CREATE_INVOICE') {
      // Logic to update invoice status to INVOICED
      this.logger.log('Updating invoice status to INVOICED...');
      return await this.generateInvoice(invoiceData);
    }

    // Payment received for order #101 for Ryan - RECORD_PAYMENT
    // update the invoice status to 'PAID'
    else if (invoiceData.intent === 'RECORD_PAYMENT') {
      // Logic to update invoice status to PAID
      this.logger.log('Updating invoice status to PAID...');
      return await this.recordPayment(invoiceData);
    } else if (invoiceData.intent === 'UNKNOWN') {
      this.logger.log('Unknown intent received. No action taken.');
      return {
        display_so_number: invoiceData.order_number || 'N/A',
        responseStr:
          'Sorry, I could not understand your request. Please try again with a valid command.',
      } as InvoiceResponse;
    } else if (invoiceData.intent === 'CHECK_INVENTORY') {
      this.logger.log('Inventory check requested. No invoice action taken.');
      if (invoiceData.target_product_name) {
        return await this.checkInventoryByProductName(
          invoiceData.target_product_name,
        );
      } else if (invoiceData.order_number) {
        return await this.checkInventoryByOrderNumber(invoiceData);
      } else {
        // return 'Please provide a product name or order number to check inventory.';
        return {
          display_so_number: invoiceData.order_number || null,
          responseStr:
            'Please provide a product name or order number to check inventory.',
        } as InvoiceResponse;
      }
    } else if (invoiceData.intent === 'STATUS_CHECK') {
      this.logger.log('Status check requested. No invoice action taken.');
      return await this.statusCheckByOrderNumber(invoiceData.order_number!);
    }
    // console.log('Processing invoice data:', invoiceData);
    // return { status: 'processed', data: invoiceData };
    // return `Functionality not implement`;
    return {
      display_so_number: invoiceData.order_number || null,
      responseStr: `Functionality for intent ${invoiceData.intent} not implemented yet.`,
    } as InvoiceResponse;
  }

  private async statusCheckByOrderNumber(
    order_number: string,
  ): Promise<InvoiceResponse> {
    let responseString = '';
    // Logic to check status for the order number
    this.logger.log('Checking status for order number:', order_number);
    // Retrieve the invoice by order_number
    const invoice = await this.invoiceRepository.findOne({
      where: { display_number: ILike(order_number) },
    });

    // If invoice not found, throw an error
    if (!invoice) {
      return {
        display_so_number: order_number,
        responseStr: `Invoice with order number ${order_number} not found`,
      } as InvoiceResponse;
    }

    responseString = `Order Number: ${invoice.display_number}, Status: ${invoice.status}, Total Amount: ${invoice.total_amount}, Paid Amount: ${invoice.paid_amount}, Balance Amount: ${invoice.balance_amount}`;
    return {
      display_so_number: invoice.display_number,
      responseStr: responseString,
    } as InvoiceResponse;
  }

  private async checkInventoryByProductName(
    product_name: string,
  ): Promise<InvoiceResponse> {
    let responseString = '';
    // Logic to check inventory for the products in the invoice
    this.logger.log('Checking inventory for products...' + product_name);
    // For each line item, check the product stock level
    const product = await this.productRepository.findOne({
      where: { name: ILike(product_name) },
    });
    if (!product) {
      return {
        display_so_number: null,
        responseStr: `Product: ${product_name} not found in inventory. Please check the product name.`,
      } as InvoiceResponse;
    }
    responseString = `Product: ${product_name}, Available Stock: ${product.current_stock}`;
    return {
      display_so_number: null,
      responseStr: responseString,
    } as InvoiceResponse;
  }

  async checkInventoryByOrderNumber(
    invoiceData: BrainClientSchema,
  ): Promise<InvoiceResponse> {
    let responseString = '';
    // Logic to check inventory for the products in the invoice
    this.logger.log(
      'Checking inventory for order number:',
      invoiceData.order_number,
    );
    // For each line item, check the product stock level
    if (invoiceData.line_items && invoiceData.line_items.length > 0) {
      for (const item of invoiceData.line_items) {
        const product = await this.productRepository.findOne({
          where: { name: ILike(item.product_name) },
        });
        if (product) {
          responseString += `Product: ${item.product_name}, Available Stock: ${product.current_stock}\n`;
        } else {
          responseString += `Product: ${item.product_name} not found in inventory.\n`;
        }
      }
    } else {
      responseString = 'No line items provided for inventory check.';
    }
    return {
      display_so_number: null,
      responseStr: responseString,
    } as InvoiceResponse;
  }

  async recordPayment(
    invoiceData: BrainClientSchema,
  ): Promise<InvoiceResponse> {
    let responseString = '';
    let invoiceStatus = 'PAID';
    // Logic to record payment for the invoice
    this.logger.log(
      'Recording payment for order number:',
      invoiceData.order_number,
    );
    // Update the invoice status to PAID
    await this.datasource.transaction(async (manager) => {
      let responseString = '';
      // if order_number is null or undefined , create a new invoice a new invoice with sales order
      if (!invoiceData.order_number) {
        responseString = await this.createNewInvoiceForMissingOrderNumber(
          invoiceData,
          manager,
        );
      }

      // Retrieve the invoice by order_number
      const invoice = await manager.findOne(Invoice, {
        where: { display_number: ILike(invoiceData.order_number!) },
      });

      // If invoice not found, throw an error
      if (!invoice) {
        throw new Error(
          `Invoice with order number ${invoiceData.order_number} not found`,
        );
      }

      this.logger.log(
        `Recording Payment for order number: ${invoiceData.order_number}`,
      );

      if (invoice.status === 'PAID') {
        this.logger.log(`Invoice already PAID. No further action needed.`);
        return `Invoice ${invoiceData.order_number} is already marked as PAID. No further action needed.`;
      }
      // Update invoice status to PAID
      invoice.paid_amount = invoiceData.customer_payment_amount || 0;
      invoice.balance_amount = invoice.balance_amount! - invoice.paid_amount;
      if (invoice.balance_amount <= 0) {
        this.logger.log(`Invoice fully paid. Updating status to PAID.`);
        invoice.status = 'PAID';
      } else {
        this.logger.log(
          `Invoice partially paid. Updating status to PARTIALLY_PAID.`,
        );
        invoice.status = 'PARTIALLY_PAID';
      }
      await manager.save(invoice);
      invoiceStatus = invoice.status;
    });

    // check if responseString is empty , then set it to success message
    if (!responseString) {
      responseString = `Payment recorded for Order ${invoiceData.order_number}. Invoice status updated to ${invoiceStatus}.`;
    } else {
      responseString += ` Invoice status updated to ${invoiceStatus}.`;
    }
    return {
      display_so_number: invoiceData.order_number!,
      responseStr: responseString,
    } as InvoiceResponse;
  }

  // Generate PDF for the invoice
  async generatePdf<T extends keyof TemplateMap>(
    templateName: T,
    data: TemplateMap[T],
  ): Promise<Buffer> {
    // Logic to generate PDF using the specified template and data
    // This is a placeholder implementation; replace with actual PDF generation logic
    this.logger.log(`Generating PDF using template: ${templateName}`);
    // For example, you might use a PDF generation library here
    return this.pdfGeneratorUtil.generatePdfFromTemplate(templateName, data);
  }

  async generateInvoice(
    invoiceData: BrainClientSchema,
  ): Promise<InvoiceResponse> {
    let responseString = '';
    // Logic to generate invoice
    await this.datasource.transaction(async (manager) => {
      if (!invoiceData.order_number) {
        responseString = await this.createNewInvoiceForMissingOrderNumber(
          invoiceData,
          manager,
        );
      }

      this.logger.log(
        `Generating invoice for order number: ${invoiceData.order_number}`,
      );

      // Retrieve the invoice by order_number
      const invoice = await manager.findOne(Invoice, {
        where: { display_number: ILike(invoiceData.order_number!) },
        relations: ['items', 'party'],
      });

      // If invoice not found, throw an error
      if (!invoice) {
        throw new Error(
          `Invoice with order number ${invoiceData.order_number} not found`,
        );
      }

      const simpleInvoiceData: SimpleInvoiceData = {
        invoice_number: invoice.display_number,
        created_date: new Date().toDateString(),
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toDateString(),
        customer_name: invoice.party.name,
        customer_email: invoice.party.email || 'N/A',
        subtotal_amount: invoice.subtotal_amount,
        tax_amount: invoice.tax_amount,
        tax_summary: invoice.tax_summary || '',
        items: await Promise.all(
          invoice.items.map(async (invItem) => {
            const product: Product | null =
              await this.productRepository.findOne({
                where: { id: invItem.productId },
              });
            return {
              name: invItem.description,
              quantity: invItem.quantity,
              unit_price: product ? product.unit_price : 5, // Default unit price if product not found
              total_price:
                invItem.quantity * (product ? product.unit_price : 5),
            };
          }),
        ),
        currency: 'CAD',
        total_amount: invoice.total_amount!,
      };

      // Generate PDF
      const pdfBuffer = await this.generatePdf(
        'simple-invoice-template',
        simpleInvoiceData,
      );

      // save pdf buffer to filesystem - for testing purpose only
      // const fs = require('fs');
      // const filePath = `./invoices/invoice_${invoice.display_number}.pdf`;
      // fs.writeFileSync(filePath, pdfBuffer);
      // this.logger.log(`Invoice PDF generated at: ${filePath}`);
      // Upload PDF to Google Cloud Storage and get signed URL
      const signedUrl = await this.googleCloudStorageUtil.uploadAndGetSignedUrl(
        `invoice_${invoice.display_number}.pdf`,
        pdfBuffer,
      );
      this.logger.log(`Invoice PDF uploaded to GCS. Signed URL: ${signedUrl}`);

      responseString = `Generated Invoice for Order ${invoiceData.order_number} and can be downloaded at https://reachable-leisha-postdiscoidal.ngrok-free.dev/view/${invoiceData.order_number}`;
      // Update invoice status to INVOICED
      invoice.status = 'INVOICED';
      await manager.save(invoice);
    });

    // check if responseString is empty , then set it to success message
    if (!responseString) {
      responseString = `Generated Invoice for Order ${invoiceData.order_number} and can be downloaded at this link. To close the order please confirm payment receipt.`;
    } else {
      responseString += ` Generated Invoice and can be downloaded at this link. To close the order please confirm payment receipt.`;
    }
    return {
      display_so_number: invoiceData.order_number!,
      responseStr: responseString,
    } as InvoiceResponse;
  }

  async fullfillOrder(
    invoiceData: BrainClientSchema,
  ): Promise<InvoiceResponse> {
    let responseString = '';
    // Logic to fullfill the order
    await this.datasource.transaction(async (manager) => {
      // if order_number is null or undefined , create a new invoice a new invoice with sales order
      if (!invoiceData.order_number) {
        responseString = await this.createNewInvoiceForMissingOrderNumber(
          invoiceData,
          manager,
        );
      }

      this.logger.log(`Fullfilling order number: ${invoiceData.order_number}`);

      // Retrieve the invoice by order_number
      const invoice = await manager.findOne(Invoice, {
        where: { display_number: ILike(invoiceData.order_number!) },
        relations: ['items'],
      });

      // If invoice not found, throw an error
      if (!invoice) {
        throw new Error(
          `Invoice with order number ${invoiceData.order_number} not found`,
        );
      }

      // Update invoice status to DELIVERED
      invoice.status = 'DELIVERED';
      await manager.save(invoice);

      // Update stock levels for each product in the invoice items
      for (const item of invoice.items) {
        const product = await manager.findOne(Product, {
          where: { id: item.productId },
        });
        if (product) {
          if (product.current_stock < item.quantity) {
            throw new Error(
              `Insufficient stock for product ${product.name}. Available: ${product.current_stock}, Required: ${item.quantity}`,
            );
          }
          product.current_stock -= item.quantity;
          await manager.save(product);
        }
      }
    });
    // check if responseString is empty , then set it to success message
    if (!responseString) {
      responseString = `Order ${invoiceData.order_number} has been successfully fulfilled and stock levels updated.`;
    } else {
      responseString += ` Order has been successfully fulfilled and stock levels updated.`;
    }
    return {
      display_so_number: invoiceData.order_number!,
      responseStr: responseString,
    } as InvoiceResponse;
  }

  private async createNewInvoiceForMissingOrderNumber(
    invoiceData: BrainClientSchema,
    manager,
  ) {
    const invoice = await this.__createInvoiceEntity(invoiceData);
    this.logger.log('Creating new invoice as order_number is not provided');
    const storedInvoice = await manager.save(invoice);
    invoiceData.order_number = storedInvoice.display_number;
    return `Created a new Sales Order with Order # ${storedInvoice?.display_number}. Use this Order number for further interactions.`;
  }

  // Create a new invoice in the database
  private async createInvoice(
    invoiceData: BrainClientSchema,
  ): Promise<Invoice> {
    const invoice = await this.__createInvoiceEntity(invoiceData);
    return await this.invoiceRepository.save(invoice);
  }

  async __createInvoiceEntity(data: BrainClientSchema): Promise<Invoice> {
    const invoice = new Invoice();
    // retrieve the highest invoice_number from the database and increment it
    const invoice_numer_max = await this.invoiceRepository
      .createQueryBuilder()
      .select('MAX(invoice.invoice_number)', 'max')
      // .from(Invoice, "invoice")
      .getRawOne();
    // .then(result => {
    //     const maxInvoiceNumber = result.max || 0;
    //     invoice.invoice_number = maxInvoiceNumber + 1;
    // });
    const maxInvoiceNumber = invoice_numer_max.max || 0;
    invoice.invoice_number = maxInvoiceNumber + 1;
    invoice.intent = data.intent;
    invoice.status = 'PENDING';
    invoice.display_number = 'SO-' + invoice.invoice_number;

    invoice.due_date = data.due_date ? new Date(data.due_date) : null;
    invoice.created_at = new Date();

    // Check if party with the name exists, if the party with the name does not exist , retrieve party with name anonymous
    const party = await this.__getPartyByName(
      data.party_name || this.DEFAULT_CUSTOMER,
      true,
    );
    // invoice.party = party!;
    // invoice.party = { id: party!.id } as Party
    invoice.partyId = party!.id;

    const organization = await this.__getOrganizationByName(
      this.DEFAULT_ORGANIZATION,
    );
    // invoice.organization = organization!;
    invoice.org_id = organization!.id;
    // invoice.organization = { id: organization!.id } as Organization;
    const invoiceItems = await this.buildInviceItemList(data, invoice);
    if (invoiceItems) {
      invoice.items = invoiceItems;
    }

    // Calculate total amount and tax
    const totalWithTax = await this.calculateTotalAmount(
      invoice,
      organization!.country,
    );

    invoice.subtotal_amount = totalWithTax.total - totalWithTax.taxAmount;
    invoice.tax_amount = totalWithTax.taxAmount;
    invoice.tax_summary = ` ${totalWithTax.taxType} @ ${totalWithTax.rate}%`;
    invoice.total_amount = totalWithTax.total;
    invoice.paid_amount = 0;
    invoice.balance_amount = invoice.total_amount;

    // this.invoiceRepository.createQueryBuilder("invoice")
    //     .leftJoinAndSelect("invoice.party", "party")
    //     .where("party.name = :name", { name: data.party_name || 'Anonymous' })

    return invoice;
  }

  // Calculate total amount for the invoice
  async calculateTotalAmount(
    invoice: Invoice,
    country: string,
  ): Promise<{
    rate: number;
    taxAmount: number;
    total: number;
    taxType: string;
  }> {
    let subtotal = 0;
    if (invoice.items && invoice.items.length > 0) {
      for (const item of invoice.items) {
        // Assuming unit_price is added to InvoiceItem entity
        // total += item.quantity * item.unit_price;
        const product = await this.productRepository.findOne({
          where: { id: item.productId },
        });
        subtotal += item.quantity * (product ? product.unit_price : 0);
      }
    }
    const total = await this.taxCalculator.calculate(country, subtotal);
    return total;
  }

  async buildInviceItemList(
    data: BrainClientSchema,
    invoice: Invoice,
  ): Promise<InvoiceItem[] | null> {
    if (!data.line_items || data.line_items.length === 0) {
      return null;
    }

    const lineItems = data.line_items;
    const invoiceItems = await Promise.all(
      lineItems.map(async (item) => {
        const invoiceItem: InvoiceItem = new InvoiceItem();
        const product = await this.__getProductByName(item.product_name);
        if (!product) {
          throw new Error(
            `Product with name ${item.product_name} not found. Please send correct product name.`,
          );
        }
        // invoiceItem.product = product!;
        // invoiceItem.product ={ id: product!.id } as Product;
        invoiceItem.productId = product.id;

        invoiceItem.quantity = item.product_quantity;
        // invoiceItem.unit_price = item.unit_price; // Uncomment if unit_price is added to InvoiceItem entity
        invoiceItem.description = item.product_name;
        invoiceItem.invoice = invoice;
        return invoiceItem;
      }),
    );

    console.log('Built Invoice Items:', invoiceItems);
    return invoiceItems;
  }

  async __getProductByName(name: string): Promise<Product | null> {
    // Placeholder for product lookup logic
    return await this.productRepository.findOne({
      where: { name: ILike(name) },
    });
  }

  async __getPartyByName(
    name: string,
    createnew: boolean,
  ): Promise<Party | null> {
    // if party is not found, search party with name 'Anonymous'
    const party = await this.partyRepository.findOne({
      where: { name: ILike(name) },
    });
    if (!party) {
      this.logger.warn(`Party with name ${name} not found.`);
      // create a new customer if createnew is true
      if (createnew) {
        const newParty = new Party();
        newParty.name = name;
        newParty.email = '';
        newParty.org_id = (await this.__getOrganizationByName(
          this.DEFAULT_ORGANIZATION,
        ))!.id;
        newParty.address = '';
        await this.partyRepository.save(newParty);
        this.logger.log(`Created new party with name ${name}.`);
        return newParty;
      }
      return await this.partyRepository.findOne({
        where: { name: ILike(this.DEFAULT_CUSTOMER) },
      });
    }
    return party;
  }

  async __getOrganizationByName(name: string): Promise<Organization | null> {
    const organization = await this.organizationRepository.findOne({
      where: { name: ILike(name) },
    });
    if (!organization) {
      this.logger.warn(`Organization with name ${name} not found.`);
      return null;
    }
    return organization;
  }
}
