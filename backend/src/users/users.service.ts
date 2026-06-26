import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOneBy({ email });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOneBy({ id });
  }

  async create(data: Partial<User>): Promise<User> {
    const exists = await this.findByEmail(data.email!);
    if (exists) throw new ConflictException('El email ya está registrado');
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  async save(user: User): Promise<User> {
    return this.userRepo.save(user);
  }

  async incrementFailedLogins(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) return;
    user.failed_login_attempts += 1;
    if (user.failed_login_attempts >= 3) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + 5);
      user.locked_until = lockUntil;
    }
    await this.userRepo.save(user);
  }

  async resetFailedLogins(userId: string): Promise<void> {
    await this.userRepo.update(userId, { failed_login_attempts: 0, locked_until: null });
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    
    const updateData = data as any;
    if (updateData.password) {
      user.password_hash = await this.hashPassword(updateData.password);
      delete updateData.password;
    }

    Object.assign(user, updateData);
    return this.userRepo.save(user);
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.userRepo.findOneBy({ reset_password_token: token });
  }
}
