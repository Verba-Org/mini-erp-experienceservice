import { IsString, IsNotEmpty } from 'class-validator';

// class used by post requests to create a new message.
// defined validation rules for the message content used by validation pipes in the controller.
export class CreateMessageDto {
    @IsString()
    @IsNotEmpty()
    content: string;
}