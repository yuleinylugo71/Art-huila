"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const typeorm_3 = require("typeorm");
const artisans_service_1 = require("../artisans/artisans.service");
const mail_service_1 = require("../mail/mail.service");
const audit_service_1 = require("../audit/audit.service");
const artisan_profile_entity_1 = require("../artisans/entities/artisan-profile.entity");
const admin_audit_log_entity_1 = require("../audit/entities/admin-audit-log.entity");
const users_service_1 = require("../users/users.service");
const orders_service_1 = require("../orders/orders.service");
const reviews_service_1 = require("../reviews/reviews.service");
const products_service_1 = require("../products/products.service");
const artisan_audit_log_entity_1 = require("../artisans/entities/artisan-audit-log.entity");
let AdminService = class AdminService {
    artisansService;
    mailService;
    auditService;
    usersService;
    ordersService;
    reviewsService;
    productsService;
    artisanAuditRepo;
    constructor(artisansService, mailService, auditService, usersService, ordersService, reviewsService, productsService, artisanAuditRepo) {
        this.artisansService = artisansService;
        this.mailService = mailService;
        this.auditService = auditService;
        this.usersService = usersService;
        this.ordersService = ordersService;
        this.reviewsService = reviewsService;
        this.productsService = productsService;
        this.artisanAuditRepo = artisanAuditRepo;
    }
    async logArtisanStatusChange(adminId, artisanId, action, reason) {
        if (!reason?.trim())
            throw new common_1.BadRequestException('La razon es obligatoria');
        return this.artisanAuditRepo.save(this.artisanAuditRepo.create({ adminId, artisanId, action, reason }));
    }
    async getArtisans(status) {
        const artisans = await this.artisansService.findAll(status);
        return Promise.all(artisans.map(a => this.artisansService.findById(a.id)));
    }
    async approveArtisan(adminId, artisanProfileId) {
        const profile = await this.artisansService.findById(artisanProfileId);
        if (!profile)
            throw new common_1.BadRequestException('Perfil no encontrado');
        if (profile.verification_status === artisan_profile_entity_1.ArtisanStatus.VERIFIED) {
            throw new common_1.BadRequestException('El artesano ya fue aprobado anteriormente');
        }
        await this.artisansService.updateStatus(artisanProfileId, artisan_profile_entity_1.ArtisanStatus.VERIFIED);
        const admin = await this.usersService.findById(adminId);
        await this.auditService.log(admin, admin_audit_log_entity_1.AuditAction.APPROVE_ARTISAN, artisanProfileId, 'Artesano aprobado');
        await this.mailService.sendArtisanApprovalEmail(profile.user.email, profile.user.full_name);
        return { message: 'Artesano aprobado y notificado' };
    }
    async verifyArtisan(adminId, artisanProfileId, reason) {
        const profile = await this.artisansService.findById(artisanProfileId);
        if (!profile)
            throw new common_1.BadRequestException('Perfil no encontrado');
        if (profile.verification_status === artisan_profile_entity_1.ArtisanStatus.VERIFIED) {
            throw new common_1.BadRequestException('El artesano ya se encuentra verificado');
        }
        await this.artisansService.updateStatus(artisanProfileId, artisan_profile_entity_1.ArtisanStatus.VERIFIED);
        await this.logArtisanStatusChange(adminId, artisanProfileId, artisan_audit_log_entity_1.ArtisanAuditAction.VERIFIED, reason);
        await this.mailService.sendArtisanApprovalEmail(profile.user.email, profile.user.full_name);
        return { message: 'Artesano verificado y notificado' };
    }
    async rejectArtisan(adminId, artisanProfileId, reason) {
        if (!reason)
            throw new common_1.BadRequestException('La razón de rechazo es obligatoria');
        const profile = await this.artisansService.findById(artisanProfileId);
        if (!profile)
            throw new common_1.BadRequestException('Perfil no encontrado');
        await this.artisansService.updateStatus(artisanProfileId, artisan_profile_entity_1.ArtisanStatus.SUSPENDED, reason);
        const admin = await this.usersService.findById(adminId);
        await this.auditService.log(admin, admin_audit_log_entity_1.AuditAction.REJECT_ARTISAN, artisanProfileId, reason);
        await this.logArtisanStatusChange(adminId, artisanProfileId, artisan_audit_log_entity_1.ArtisanAuditAction.SUSPENDED, reason);
        await this.mailService.sendArtisanRejectionEmail(profile.user.email, profile.user.full_name, reason);
        return { message: 'Artesano rechazado y notificado' };
    }
    async suspendArtisan(adminId, artisanProfileId, reason) {
        const profile = await this.artisansService.findById(artisanProfileId);
        if (!profile)
            throw new common_1.BadRequestException('Perfil no encontrado');
        await this.artisansService.updateStatus(artisanProfileId, artisan_profile_entity_1.ArtisanStatus.SUSPENDED, reason);
        const admin = await this.usersService.findById(adminId);
        await this.auditService.log(admin, admin_audit_log_entity_1.AuditAction.SUSPEND_ARTISAN, artisanProfileId, 'Artesano suspendido');
        await this.logArtisanStatusChange(adminId, artisanProfileId, artisan_audit_log_entity_1.ArtisanAuditAction.SUSPENDED, reason);
        await this.mailService.sendArtisanSuspensionEmail(profile.user.email, profile.user.full_name);
        return { message: 'Artesano suspendido y notificado' };
    }
    async getArtisanAudit(artisanProfileId) {
        return this.artisanAuditRepo.find({
            where: { artisanId: artisanProfileId },
            order: { createdAt: 'DESC' },
        });
    }
    async getAllOrders(start, end) {
        if (start && end) {
            return this.ordersService['ordersRepository'].find({
                where: { created_at: (0, typeorm_1.Between)(new Date(start), new Date(end)) },
                relations: ['user', 'items', 'items.product', 'items.product.artisan'],
                order: { created_at: 'DESC' },
            });
        }
        return this.ordersService.findAll();
    }
    async deleteReview(adminId, reviewId, reason) {
        const review = await this.reviewsService.findOne(reviewId);
        if (!review)
            throw new common_1.BadRequestException('Reseña no encontrada');
        await this.reviewsService.remove(reviewId);
        const admin = await this.usersService.findById(adminId);
        await this.auditService.log(admin, admin_audit_log_entity_1.AuditAction.DELETE_REVIEW, reviewId, `Razón: ${reason}`);
        return { message: 'Reseña eliminada correctamente' };
    }
    async keepReview(adminId, reviewId) {
        await this.reviewsService.resetReport(reviewId);
        return { message: 'Reporte de reseña descartado' };
    }
    async getReportedReviews() {
        return this.reviewsService.findReported();
    }
    async getAllProducts() {
        return this.productsService.findAll();
    }
    async hideProduct(adminId, productId) {
        await this.productsService.hide(productId);
        const admin = await this.usersService.findById(adminId);
        await this.auditService.log(admin, admin_audit_log_entity_1.AuditAction.HIDE_PRODUCT, productId, 'Producto ocultado por admin');
        return { message: 'Producto ocultado' };
    }
    async deleteProduct(adminId, productId) {
        await this.productsService.remove(productId);
        const admin = await this.usersService.findById(adminId);
        await this.auditService.log(admin, admin_audit_log_entity_1.AuditAction.DELETE_PRODUCT, productId, 'Producto eliminado por admin');
        return { message: 'Producto eliminado' };
    }
    async getAuditLogs() {
        return this.auditService.findAll();
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(7, (0, typeorm_2.InjectRepository)(artisan_audit_log_entity_1.ArtisanAuditLog)),
    __metadata("design:paramtypes", [artisans_service_1.ArtisansService,
        mail_service_1.MailService,
        audit_service_1.AuditService,
        users_service_1.UsersService,
        orders_service_1.OrdersService,
        reviews_service_1.ReviewsService,
        products_service_1.ProductsService,
        typeorm_3.Repository])
], AdminService);
//# sourceMappingURL=admin.service.js.map