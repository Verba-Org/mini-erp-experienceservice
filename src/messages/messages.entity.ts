import { Entity , Column , PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { User } from "../users/users.entity";

@Entity()
export class MessagesEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    content: string;

    @ManyToOne(() => User, user => user.messages)
    user: User;
}