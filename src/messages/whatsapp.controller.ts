import { Controller, Post, Body, Logger, Res } from '@nestjs/common';
import type { Response } from 'express';
import { BrainClientFacade } from 'src/clients/brain.client.facade';
import { WhatsappTwilioFacade } from 'src/clients/whatsapp.twilio.facade';
import { InvoiceProcessorFacadeImpl } from './facade/invoice.processor.facade';
import { BrainClientSchema } from 'src/clients/schema/brain.client.schema';
import { UsersService } from 'src/users/users.service';
import { CurrentUserSession } from 'src/common/decorators/current-user.decorator';
import { UserSessionEntity } from 'src/users/user-session-entity';

// Controller definition for WhatsApp-related operations.
@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private whatsappTwilioFacade: WhatsappTwilioFacade,
    private brainClientFacade: BrainClientFacade,
    private invoiceProcessorFacade: InvoiceProcessorFacadeImpl,
    private usersService: UsersService,
  ) {}

  // Endpoint to send a WhatsApp message.
  @Post('webhook')
  async handleIncomingMessage(
    @Body() body: any,
    @Res() res: Response,
    @CurrentUserSession() userSession,
  ) {
    const from = body.From; // Sender's WhatsApp number
    const messageBody = body.Body; // Message content

    this.logger.log(`Received WhatsApp message from ${from}: ${messageBody}`);

    // Example: Send an automated reply
    await this.processMessage(from, messageBody, userSession);

    // Acknowledge receipt of the message
    res.status(200).send('Message received');
  }

  private async processMessage(
    from: string,
    messageBody: string,
    userSession: UserSessionEntity,
  ) {
    try {
      // Implement your message processing logic here
      this.logger.log(`Processing message from ${from}: ${messageBody}`);
      // Perform AI analysis, invoice processing, etc.
      const brainResponse: BrainClientSchema =
        await this.brainClientFacade.fetchBrainData(messageBody);
      const result =
        await this.invoiceProcessorFacade.processInvoice(brainResponse);
      this.logger.log(`Processed result: ${JSON.stringify(result)}`);
      if (result.display_so_number) {
        userSession.activeOrders.push(result.display_so_number);
      }
      // Optionally, send a response back to the user
      const responseMessage = `Your request has been processed. Result: ${JSON.stringify(result)}`;
      await this.whatsappTwilioFacade.sendMessage(
        from.replace('whatsapp:', ''),
        responseMessage,
      );
    } catch (error) {
      this.logger.error(
        `Error processing message from ${from}: ${error.message}`,
      );
      await this.whatsappTwilioFacade.sendMessage(
        from.replace('whatsapp:', ''),
        'Sorry, there was an error processing your request.',
      );
    }
  }
}
