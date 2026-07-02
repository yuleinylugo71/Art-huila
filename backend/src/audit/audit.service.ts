import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminAuditLog, AuditAction } from './entities/admin-audit-log.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AdminAuditLog)
    private readonly auditRepo: Repository<AdminAuditLog>,
  ) {}

  async log(
    admin: User,
    action: AuditAction,
    targetId: string,
    details?: string,
  ) {
    const entry = this.auditRepo.create({
      admin,
      action,
      target_id: targetId,
      details,
    });
    return this.auditRepo.save(entry);
  }

  async findAll() {
    return this.auditRepo.find({
      relations: ['admin'],
      order: { created_at: 'DESC' },
    });
  }
}
