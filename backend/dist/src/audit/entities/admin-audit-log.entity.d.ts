import { User } from '../../users/entities/user.entity';
export declare enum AuditAction {
    APPROVE_ARTISAN = "approve_artisan",
    REJECT_ARTISAN = "reject_artisan",
    SUSPEND_ARTISAN = "suspend_artisan",
    DELETE_REVIEW = "delete_review",
    UPDATE_ORDER = "update_order",
    HIDE_PRODUCT = "hide_product",
    DELETE_PRODUCT = "delete_product",
    BULK_UPLOAD_PRODUCTS = "bulk_upload_products"
}
export declare class AdminAuditLog {
    id: string;
    admin: User;
    action: AuditAction;
    target_id: string;
    details: string;
    created_at: Date;
}
