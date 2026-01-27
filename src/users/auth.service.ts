import { Injectable } from "@nestjs/common";
import { UsersService } from "./users.service";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

@Injectable()
export class AuthService {


    constructor(private usersService: UsersService) {}

    async signUp(email: string, password: string) {
        // Check if user already exists
        const [user] = await this.usersService.find(email);
        console.log(user);

        if (user) {
            throw new Error('User already exists');
        }

        // Hash password
        const salt = randomBytes(8).toString('hex');
        
        const hash = (await scryptAsync(password, salt, 32)) as Buffer;
        // store the salt with the hash so we can verify the password later
        const hashedPassword = salt + '.' + hash.toString('hex');

        return this.usersService.createUser(email, hashedPassword);

    }

    async signIn(email: string, password: string) {
        // destructure the array response and get the first user in user variable
        const [user] = await this.usersService.find(email);

        if (!user) {
            throw new Error('User not found');
        }

        // Verify password
        const [salt, storedHash] = user.password.split('.');

        const hash = (await scryptAsync(password, salt, 32)) as Buffer;

        if (storedHash !== hash.toString('hex')) {
            throw new Error('Invalid password');
        }

        return user;
        
    }
}
