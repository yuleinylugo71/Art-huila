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
exports.AdminAuditLog = exports.AuditAction = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
var AuditAction;
(function (AuditAction) {
    AuditAction["APPROVE_ARTISAN"] = "approve_artisan";
    AuditAction["REJECT_ARTISAN"] = "reject_artisan";
    AuditAction["SUSPEND_ARTISAN"] = "suspend_artisan";
    AuditAction["DELETE_REVIEW"] = "delete_review";
    AuditAction["UPDATE_ORDER"] = "update_order";
    AuditAction["HIDE_PRODUCT"] = "hide_product";
    AuditAction["DELETE_PRODUCT"] = "delete_product";
    AuditAction["BULK_UPLOAD_PRODUCTS"] = "bulk_upload_products";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
let AdminAuditLog = class AdminAuditLog {
    id;
    admin;
    action;
    target_id;
    details;
    created_at;
};
exports.AdminAuditLog = AdminAuditLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AdminAuditLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'admin_id' }),
    __metadata("design:type", user_entity_1.User)
], AdminAuditLog.prototype, "admin", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: AuditAction }),
    __metadata("design:type", String)
], AdminAuditLog.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], AdminAuditLog.prototype, "target_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AdminAuditLog.prototype, "details", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AdminAuditLog.prototype, "created_at", void 0);
exports.AdminAuditLog = AdminAuditLog = __decorate([
    (0, typeorm_1.Entity)('admin_audit_log')
], AdminAuditLog);
//# sourceMappingURL=admin-audit-log.entity.js.map