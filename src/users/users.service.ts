import { Injectable } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users.entity';
import { UserSessionEntity } from './user-session-entity';

@Injectable()
export class UsersService {
  // create a constructor that injects the User repository and InjectRepository decorator is used to inject the repository for the User entity.
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(UserSessionEntity)
    private userSessionRepository: Repository<UserSessionEntity>,
  ) {}

  createSession(from: string, activeOrders: string[], expiresAt: Date) {
    const session = this.userSessionRepository.create({
      phoneNumber: from,
      activeOrders,
      expiresAt,
    });
    return this.userSessionRepository.save(session);
  }

  getSession(phoneNumber: string) {
    return this.userSessionRepository.findOne({ where: { phoneNumber } });
  }

  updateSession(session: UserSessionEntity) {
    return this.userSessionRepository.save(session);
  }

  createUser(email: string, password: string) {
    // Creates a new managed User entity instance
    // This also results in executing any hooks defined in the entity class (e.g., @BeforeInsert)
    const user = this.userRepository.create({ email, password });
    // Saves the User entity instance to the database
    return this.userRepository.save(user);
  }

  findOne(id: string) {
    if (!id) {
      throw new Error('ID must be provided');
    }
    return this.userRepository.findOne({ where: { id } });
  }

  find(email: string) {
    return this.userRepository.find({ where: { email } });
  }

  // Partial<User> indicates that the attrs object can contain any subset of the User entity's properties.
  async update(id: string, attrs: Partial<User>) {
    // Following this approach to ensure that hooks are executed
    const user = await this.findOne(id);
    if (!user) {
      throw new Error('User not found');
    }
    Object.assign(user, attrs);
    return this.userRepository.save(user);
    // return this.userRepository.update(id, attrs);
  }

  async remove(id: string) {
    // delete user by id, no hooks are executed
    // return this.userRepository.delete(id);

    const user = await this.findOne(id);
    if (!user) {
      throw new Error('User not found');
    }
    return this.userRepository.remove(user);
  }
}
