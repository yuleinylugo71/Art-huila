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
exports.ArtisansService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const artisan_profile_entity_1 = require("./entities/artisan-profile.entity");
const artisan_gallery_entity_1 = require("./entities/artisan-gallery.entity");
let ArtisansService = class ArtisansService {
    profileRepo;
    galleryRepo;
    constructor(profileRepo, galleryRepo) {
        this.profileRepo = profileRepo;
        this.galleryRepo = galleryRepo;
    }
    async findByUserId(userId) {
        return this.profileRepo.findOne({
            where: { user: { id: userId } },
            relations: ['user', 'category', 'region', 'gallery'],
        });
    }
    async findById(id) {
        return this.profileRepo.findOne({
            where: { id },
            relations: ['user', 'category', 'region', 'gallery'],
        });
    }
    async findAll(status) {
        const where = {};
        if (status)
            where.verification_status = status;
        return this.profileRepo.find({
            where,
            relations: ['user', 'category', 'region'],
            order: { created_at: 'DESC' },
        });
    }
    async addGalleryImage(profileId, url, publicId) {
        const profile = await this.profileRepo.findOneBy({ id: profileId });
        if (!profile)
            throw new common_1.NotFoundException('Artisan not found');
        const img = this.galleryRepo.create({ url, public_id: publicId, profile });
        return this.galleryRepo.save(img);
    }
    async updateStatus(id, status, rejectionReason) {
        const profile = await this.profileRepo.findOneBy({ id });
        if (!profile)
            throw new common_1.NotFoundException('Perfil no encontrado');
        profile.verification_status = status;
        if (rejectionReason)
            profile.rejection_reason = rejectionReason;
        return this.profileRepo.save(profile);
    }
    async updateProfile(userId, data) {
        const profile = await this.profileRepo.findOne({ where: { user: { id: userId } } });
        if (!profile)
            throw new common_1.NotFoundException('Perfil no encontrado');
        if (data.cultural_history)
            profile.cultural_history = data.cultural_history;
        if (data.avatar_url)
            profile.avatar_url = data.avatar_url;
        if (data.category_id)
            profile.category = { id: data.category_id };
        if (data.region_id)
            profile.region = { id: data.region_id };
        return this.profileRepo.save(profile);
    }
    async findFeatured() {
        return this.profileRepo.find({
            where: { verification_status: artisan_profile_entity_1.VerificationStatus.VERIFIED },
            relations: ['user', 'region'],
            take: 3,
            order: { created_at: 'DESC' },
        });
    }
};
exports.ArtisansService = ArtisansService;
exports.ArtisansService = ArtisansService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(artisan_profile_entity_1.ArtisanProfile)),
    __param(1, (0, typeorm_1.InjectRepository)(artisan_gallery_entity_1.ArtisanGallery)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ArtisansService);
//# sourceMappingURL=artisans.service.js.map