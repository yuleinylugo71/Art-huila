import { Repository } from 'typeorm';
import { AdminAuditLog, AuditAction } from './entities/admin-audit-log.entity';
import { User } from '../users/entities/user.entity';
export declare class AuditService {
    private readonly auditRepo;
    constructor(auditRepo: Repository<AdminAuditLog>);
    log(admin: User, action: AuditAction, targetId: string, details?: string): Promise<AdminAuditLog>;
    findAll(): Promise<AdminAuditLog[]>;
}
