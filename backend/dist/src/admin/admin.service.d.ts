import { Repository } from 'typeorm';
import { ArtisansService } from '../artisans/artisans.service';
import { MailService } from '../mail/mail.service';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';
import { OrdersService } from '../orders/orders.service';
import { ReviewsService } from '../reviews/reviews.service';
import { ProductsService } from '../products/products.service';
import { ArtisanAuditLog } from '../artisans/entities/artisan-audit-log.entity';
export declare class AdminService {
    private readonly artisansService;
    private readonly mailService;
    private readonly auditService;
    private readonly usersService;
    private readonly ordersService;
    private readonly reviewsService;
    private readonly productsService;
    private readonly artisanAuditRepo;
    constructor(artisansService: ArtisansService, mailService: MailService, auditService: AuditService, usersService: UsersService, ordersService: OrdersService, reviewsService: ReviewsService, productsService: ProductsService, artisanAuditRepo: Repository<ArtisanAuditLog>);
    private logArtisanStatusChange;
    getArtisans(status?: string): Promise<(import("../artisans/entities/artisan-profile.entity").ArtisanProfile | null)[]>;
    approveArtisan(adminId: string, artisanProfileId: string): Promise<{
        message: string;
    }>;
    verifyArtisan(adminId: string, artisanProfileId: string, reason: string): Promise<{
        message: string;
    }>;
    rejectArtisan(adminId: string, artisanProfileId: string, reason: string): Promise<{
        message: string;
    }>;
    suspendArtisan(adminId: string, artisanProfileId: string, reason: string): Promise<{
        message: string;
    }>;
    getArtisanAudit(artisanProfileId: string): Promise<ArtisanAuditLog[]>;
    getAllOrders(start?: string, end?: string): Promise<import("../orders/entities/order.entity").Order[]>;
    deleteReview(adminId: string, reviewId: string, reason: string): Promise<{
        message: string;
    }>;
    keepReview(adminId: string, reviewId: string): Promise<{
        message: string;
    }>;
    getReportedReviews(): Promise<import("../reviews/entities/review.entity").Review[]>;
    getAllProducts(): Promise<import("../products/entities/product.entity").Product[]>;
    hideProduct(adminId: string, productId: string): Promise<{
        message: string;
    }>;
    deleteProduct(adminId: string, productId: string): Promise<{
        message: string;
    }>;
    getAuditLogs(): Promise<import("../audit/entities/admin-audit-log.entity").AdminAuditLog[]>;
}
