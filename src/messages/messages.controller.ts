import { Controller , Get , Post , Body , Query , Param, UseGuards } from '@nestjs/common';
import { CreateMessageDto } from './dtos/create-message.dtos';
import { MessagesService } from './messages.services';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Serialize } from 'src/common/interceptors/serialize.interceptors';
import { MessageDto } from './dtos/message.dto';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { User } from 'src/users/users.entity';

// Controller definition for Messages. Controllers handle incoming requests and return responses to the client.
@Controller('messages')
export class MessagesController {

    // TypeScript shorthand for declaring and initializing a private member variable
    constructor(private messagesService: MessagesService) {}

    @Get()
    @UseGuards(AdminGuard)
    getMessages() {
        return this.messagesService.getAllMessages();
        // this.messagesService.getAllMessages();
    }

    @Post('/accept')
    @UseGuards(AuthGuard)
    acceptUserRequest(@Body() body: CreateMessageDto, @CurrentUser() user: User) {
        console.log('Accepted user request with content: ', body.content);
        return this.messagesService.acceptUserRequest(body.content, user);
    }

    @Post()
    @UseGuards(AuthGuard)
    @Serialize(MessageDto)
    createMessage(@Body() body: CreateMessageDto, @CurrentUser() user) {
        return this.messagesService.createMessage(body.content, user);
        // return `This action adds a new message: ${body.content}`;
        
    }

    @Get('/:id')
    getMessageById(@Param('id') id: string) {
        // this.messagesService
        return 'This action returns a message by id : ' + id;
    }

    


}
