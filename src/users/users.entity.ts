import { MessagesEntity } from "src/messages/messages.entity";
import { AfterInsert, AfterRemove, AfterUpdate, Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // @Column()
    // name: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column({ default: true })
    admin: boolean;

    @OneToMany(() => MessagesEntity, message => message.user)
    messages: MessagesEntity[];

    @AfterInsert()
    logInsert() {
        console.log(`A new user has been inserted with id: ${this.id}`);
    }

    @AfterUpdate()
    logUpdate() {
        console.log(`User with id: ${this.id} has been updated`);
    }
    
    @AfterRemove()
    logRemove() {
        console.log(`User with id: ${this.id} has been removed`);
    }
}