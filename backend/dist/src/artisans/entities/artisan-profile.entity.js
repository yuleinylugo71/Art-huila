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
exports.ArtisanProfile = exports.VerificationStatus = exports.ArtisanStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const region_entity_1 = require("../../regions/entities/region.entity");
const category_entity_1 = require("../../categories/entities/category.entity");
const artisan_gallery_entity_1 = require("./artisan-gallery.entity");
var ArtisanStatus;
(function (ArtisanStatus) {
    ArtisanStatus["PENDING"] = "pending";
    ArtisanStatus["ACTIVE"] = "active";
    ArtisanStatus["VERIFIED"] = "verified";
    ArtisanStatus["SUSPENDED"] = "suspended";
})(ArtisanStatus || (exports.VerificationStatus = exports.ArtisanStatus = ArtisanStatus = {}));
let ArtisanProfile = class ArtisanProfile {
    id;
    user;
    id_number;
    cultural_history;
    category;
    region;
    verification_status;
    rejection_reason;
    truthfulness_declaration;
    legal_acceptance_ip;
    legal_acceptance_timestamp;
    avatar_url;
    id_document_front_url;
    id_document_back_url;
    gallery;
    created_at;
    updated_at;
};
exports.ArtisanProfile = ArtisanProfile;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ArtisanProfile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", user_entity_1.User)
], ArtisanProfile.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, nullable: true }),
    __metadata("design:type", String)
], ArtisanProfile.prototype, "id_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], ArtisanProfile.prototype, "cultural_history", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => category_entity_1.Category),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", category_entity_1.Category)
], ArtisanProfile.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => region_entity_1.Region),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", region_entity_1.Region)
], ArtisanProfile.prototype, "region", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ArtisanStatus, default: ArtisanStatus.PENDING }),
    __metadata("design:type", String)
], ArtisanProfile.prototype, "verification_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ArtisanProfile.prototype, "rejection_reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ArtisanProfile.prototype, "truthfulness_declaration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], ArtisanProfile.prototype, "legal_acceptance_ip", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], ArtisanProfile.prototype, "legal_acceptance_timestamp", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ArtisanProfile.prototype, "avatar_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], ArtisanProfile.prototype, "id_document_front_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], ArtisanProfile.prototype, "id_document_back_url", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => artisan_gallery_entity_1.ArtisanGallery, gallery => gallery.profile),
    __metadata("design:type", Array)
], ArtisanProfile.prototype, "gallery", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ArtisanProfile.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ArtisanProfile.prototype, "updated_at", void 0);
exports.ArtisanProfile = ArtisanProfile = __decorate([
    (0, typeorm_1.Entity)('artisan_profiles')
], ArtisanProfile);
//# sourceMappingURL=artisan-profile.entity.js.map