import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
export declare class UsersService {
    private readonly userRepo;
    constructor(userRepo: Repository<User>);
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    create(data: Partial<User>): Promise<User>;
    save(user: User): Promise<User>;
    incrementFailedLogins(userId: string): Promise<void>;
    resetFailedLogins(userId: string): Promise<void>;
    hashPassword(password: string): Promise<string>;
}
