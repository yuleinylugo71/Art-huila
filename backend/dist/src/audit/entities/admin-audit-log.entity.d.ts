import { User } from '../../users/entities/user.entity';
export declare enum AuditAction {
    APPROVE_ARTISAN = "approve_artisan",
    REJECT_ARTISAN = "reject_artisan",
    SUSPEND_ARTISAN = "suspend_artisan"
}
export declare class AdminAuditLog {
    id: string;
    admin: User;
    action: AuditAction;
    target_id: string;
    details: string;
    created_at: Date;
}
