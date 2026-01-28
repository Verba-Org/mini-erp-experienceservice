import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { MessagesEntity } from "./messages.entity";
import { User } from "src/users/users.entity";
import { BrainClientFacade } from "src/clients/brain.client.facade";
import { BrainClientSchema } from "src/clients/schema/brain.client.schema";


// Like a component annotation in spring boot framework. Marks the class as a provider that can be injected as a dependency.
@Injectable()
export class MessagesService {

    constructor(@InjectRepository(MessagesEntity) private messageRepository: Repository<MessagesEntity>, private brainClientFacade:  BrainClientFacade) {}   

    getMessageById(id: string) {
        
    }  
    getAllMessages() {
        return this.messageRepository.find({ relations: ['user'] });
    }  

    createMessage(content: string , user: User) {
        const message = this.messageRepository.create({ content , user });
        return this.messageRepository.save(message);
    }

    async acceptUserRequest(content: string, user: User) {
        const response : BrainClientSchema =  await this.brainClientFacade.fetchBrainData(content);
        console.log('Brain Client Response:', response);

        // extract intent from response 
        const intent = response.intent;
        console.log('Extracted Intent:', intent);

        // and update invoices entity depending on the intent 
//         The Intent: User texts: "Ryan wants 800 bottles of Kingfisher by Feb 1st."

// Ryan Wants 800 bottles of Kingfisher by Feb 1st. - CREATE_SALES_ORDER
        // Generate a entry in invoice table with status = 'PENDING' and generate an display message
// Sold Ryan 800 bottles of Kingfisher for order <display message> - CREATE_FULLFILLMENT
        // Update the invoice status to 'DELIVERED'
// Generate invoice for order #101 for Ryan - CREATE_INVOICE
        // update the invoice status to 'INVOICED'
// Payment received for order #101 for Ryan - RECORD_PAYMENT
        // update the invoice status to 'PAID'

// The System: Creates an Invoice with status = 'PENDING'. 
// It returns: "Order #101 created for Ryan (Pending)."

// The Delivery: When the goods actually move, your cousin texts: "Order #101 delivered." 
// 4. The Invoice: The system asks: "Should I generate the final GST/HST invoice for Ryan now?" 5. The Completion: User says "Yes." System changes status = 'PAID' and sends the PDF.

        return response;

    }
}