import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getArtisans(status?: string): Promise<(import("../artisans/entities/artisan-profile.entity").ArtisanProfile | null)[]>;
    approve(id: string, user: any): Promise<{
        message: string;
    }>;
    verificarArtesano(id: string, reason: string, user: any): Promise<{
        message: string;
    }>;
    reject(id: string, reason: string, user: any): Promise<{
        message: string;
    }>;
    suspend(id: string, reason: string, user: any): Promise<{
        message: string;
    }>;
    suspenderArtesano(id: string, reason: string, user: any): Promise<{
        message: string;
    }>;
    getArtisanAudit(id: string): Promise<import("../artisans/entities/artisan-audit-log.entity").ArtisanAuditLog[]>;
    getOrders(start?: string, end?: string): Promise<import("../orders/entities/order.entity").Order[]>;
    deleteReview(id: string, reason: string, user: any): Promise<{
        message: string;
    }>;
    getAuditLogs(): Promise<import("../audit/entities/admin-audit-log.entity").AdminAuditLog[]>;
    getProducts(): Promise<import("../products/entities/product.entity").Product[]>;
    hideProduct(id: string, user: any): Promise<{
        message: string;
    }>;
    deleteProduct(id: string, user: any): Promise<{
        message: string;
    }>;
    getReportedReviews(): Promise<import("../reviews/entities/review.entity").Review[]>;
    keepReview(id: string, user: any): Promise<{
        message: string;
    }>;
}
