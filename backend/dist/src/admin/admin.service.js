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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const artisans_service_1 = require("../artisans/artisans.service");
const mail_service_1 = require("../mail/mail.service");
const audit_service_1 = require("../audit/audit.service");
const artisan_profile_entity_1 = require("../artisans/entities/artisan-profile.entity");
const admin_audit_log_entity_1 = require("../audit/entities/admin-audit-log.entity");
const users_service_1 = require("../users/users.service");
let AdminService = class AdminService {
    artisansService;
    mailService;
    auditService;
    usersService;
    constructor(artisansService, mailService, auditService, usersService) {
        this.artisansService = artisansService;
        this.mailService = mailService;
        this.auditService = auditService;
        this.usersService = usersService;
    }
    async getArtisans(status) {
        return this.artisansService.findAll(status);
    }
    async approveArtisan(adminId, artisanProfileId) {
        const profile = await this.artisansService.findById(artisanProfileId);
        if (!profile)
            throw new common_1.BadRequestException('Perfil no encontrado');
        await this.artisansService.updateStatus(artisanProfileId, artisan_profile_entity_1.VerificationStatus.VERIFIED);
        const admin = await this.usersService.findById(adminId);
        await this.auditService.log(admin, admin_audit_log_entity_1.AuditAction.APPROVE_ARTISAN, artisanProfileId, 'Artesano aprobado');
        await this.mailService.sendArtisanApprovalEmail(profile.user.email, profile.user.full_name);
        return { message: 'Artesano aprobado y notificado' };
    }
    async rejectArtisan(adminId, artisanProfileId, reason) {
        if (!reason)
            throw new common_1.BadRequestException('La razón de rechazo es obligatoria');
        const profile = await this.artisansService.findById(artisanProfileId);
        if (!profile)
            throw new common_1.BadRequestException('Perfil no encontrado');
        await this.artisansService.updateStatus(artisanProfileId, artisan_profile_entity_1.VerificationStatus.REJECTED, reason);
        const admin = await this.usersService.findById(adminId);
        await this.auditService.log(admin, admin_audit_log_entity_1.AuditAction.REJECT_ARTISAN, artisanProfileId, reason);
        await this.mailService.sendArtisanRejectionEmail(profile.user.email, profile.user.full_name, reason);
        return { message: 'Artesano rechazado y notificado' };
    }
    async suspendArtisan(adminId, artisanProfileId) {
        const profile = await this.artisansService.findById(artisanProfileId);
        if (!profile)
            throw new common_1.BadRequestException('Perfil no encontrado');
        await this.artisansService.updateStatus(artisanProfileId, artisan_profile_entity_1.VerificationStatus.SUSPENDED);
        const admin = await this.usersService.findById(adminId);
        await this.auditService.log(admin, admin_audit_log_entity_1.AuditAction.SUSPEND_ARTISAN, artisanProfileId, 'Artesano suspendido');
        await this.mailService.sendArtisanSuspensionEmail(profile.user.email, profile.user.full_name);
        return { message: 'Artesano suspendido y notificado' };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [artisans_service_1.ArtisansService,
        mail_service_1.MailService,
        audit_service_1.AuditService,
        users_service_1.UsersService])
], AdminService);
//# sourceMappingURL=admin.service.js.map