import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { MessagesEntity } from "./messages.entity";
import { User } from "src/users/users.entity";
import { BrainClientFacade } from "src/clients/brain.client.facade";


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
        return await this.brainClientFacade.fetchBrainData(content);
    }
}