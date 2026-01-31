import { Injectable, Logger } from "@nestjs/common";
import { Twilio } from 'twilio';
import { ConfigService } from "@nestjs/config";

// 

@Injectable()
export class WhatsappTwilioFacade {

    private client: Twilio;
    private readonly logger = new Logger(WhatsappTwilioFacade.name);

    constructor(private configService: ConfigService) {
        const accountSid = configService.get('TWILIO_ACCOUNT_SID');
        const authToken = configService.get('TWILIO_AUTH_TOKEN');

        this.client = new Twilio(accountSid, authToken);
    }

    async sendMessage(to: string, body: string): Promise<void> {
        try {
            await this.client.messages.create({
                from: `${this.configService.get('TWILIO_WHATSAPP_NUMBER')}`,
                to: `whatsapp:${to}`,
                body: body,
            });
            this.logger.log(`WhatsApp message sent to ${to}`);
        } catch (error) {
            this.logger.error(`Failed to send WhatsApp message to ${to}: ${error.message}`);
        }
    }

}
