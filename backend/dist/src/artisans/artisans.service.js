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
const user_entity_1 = require("../users/entities/user.entity");
let ArtisansService = class ArtisansService {
    profileRepo;
    galleryRepo;
    constructor(profileRepo, galleryRepo) {
        this.profileRepo = profileRepo;
        this.galleryRepo = galleryRepo;
    }
    async findByUserId(userId) {
        const profile = await this.profileRepo.findOne({
            where: { user: { id: userId } },
            relations: ['user', 'category', 'region', 'gallery'],
        });
        if (profile)
            profile.status = profile.verification_status;
        return profile;
    }
    async findById(id) {
        const profile = await this.profileRepo.findOne({
            where: { id },
            relations: ['user', 'category', 'region', 'gallery'],
        });
        if (profile)
            profile.status = profile.verification_status;
        return profile;
    }
    async findAll(status) {
        const where = {};
        if (status)
            where.verification_status = status;
        const profiles = await this.profileRepo.find({
            where,
            relations: ['user', 'category', 'region'],
            order: { created_at: 'DESC' },
        });
        return profiles.map((profile) => {
            profile.status = profile.verification_status;
            return profile;
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
        const profile = await this.profileRepo.findOne({
            where: { user: { id: userId } },
            relations: ['user', 'category', 'region'],
        });
        if (!profile)
            throw new common_1.NotFoundException('Perfil no encontrado');
        if (data.cultural_history !== undefined)
            profile.cultural_history = data.cultural_history;
        if (data.avatar_url !== undefined)
            profile.avatar_url = data.avatar_url;
        if (data.category_id !== undefined)
            profile.category = { id: data.category_id };
        if (data.region_id !== undefined)
            profile.region = { id: data.region_id };
        if (data.id_number !== undefined)
            profile.id_number = data.id_number;
        if (data.truthfulness_declaration !== undefined) {
            profile.truthfulness_declaration = data.truthfulness_declaration === true || data.truthfulness_declaration === 'true';
        }
        if (data.id_document_front_url !== undefined)
            profile.id_document_front_url = data.id_document_front_url;
        if (data.id_document_back_url !== undefined)
            profile.id_document_back_url = data.id_document_back_url;
        if (data.full_name && profile.user) {
            profile.user.full_name = data.full_name;
            await this.profileRepo.manager.save(profile.user);
        }
        await this.profileRepo.save(profile);
        return this.findByUserId(userId);
    }
    async findFeatured() {
        return this.profileRepo.find({
            where: { verification_status: artisan_profile_entity_1.ArtisanStatus.VERIFIED },
            relations: ['user', 'region'],
            take: 3,
            order: { created_at: 'DESC' },
        });
    }
    async apply(userId, data, idDocumentFrontUrl, idDocumentBackUrl, galleryUrls, clientIp) {
        let profile = await this.profileRepo.findOne({
            where: { user: { id: userId } },
            relations: ['user', 'gallery'],
        });
        if (profile) {
            if (profile.verification_status === artisan_profile_entity_1.ArtisanStatus.PENDING ||
                profile.verification_status === artisan_profile_entity_1.ArtisanStatus.VERIFIED ||
                profile.verification_status === artisan_profile_entity_1.ArtisanStatus.ACTIVE) {
                throw new common_1.ConflictException('Ya tienes una solicitud pendiente, activa o verificada.');
            }
        }
        const existingArtisan = await this.profileRepo.findOne({ where: { id_number: data.id_number } });
        if (existingArtisan && (!profile || existingArtisan.id !== profile.id)) {
            throw new common_1.ConflictException('El número de cédula (ID) ya se encuentra registrado');
        }
        const user = await this.profileRepo.manager.findOne(user_entity_1.User, { where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('Usuario no encontrado');
        user.role = user_entity_1.Role.ARTESANO;
        await this.profileRepo.manager.save(user);
        if (!profile) {
            profile = this.profileRepo.create({
                user,
                id_number: data.id_number,
                cultural_history: data.cultural_history,
                category: { id: data.category_id },
                region: { id: data.region_id },
                verification_status: artisan_profile_entity_1.ArtisanStatus.PENDING,
                truthfulness_declaration: data.truthfulness_declaration === true || data.truthfulness_declaration === 'true',
                legal_acceptance_ip: clientIp,
                legal_acceptance_timestamp: new Date(),
                id_document_front_url: idDocumentFrontUrl,
                id_document_back_url: idDocumentBackUrl,
            });
        }
        else {
            profile.id_number = data.id_number;
            profile.cultural_history = data.cultural_history;
            profile.category = { id: data.category_id };
            profile.region = { id: data.region_id };
            profile.verification_status = artisan_profile_entity_1.ArtisanStatus.PENDING;
            profile.truthfulness_declaration = data.truthfulness_declaration === true || data.truthfulness_declaration === 'true';
            profile.legal_acceptance_ip = clientIp;
            profile.legal_acceptance_timestamp = new Date();
            if (idDocumentFrontUrl)
                profile.id_document_front_url = idDocumentFrontUrl;
            if (idDocumentBackUrl)
                profile.id_document_back_url = idDocumentBackUrl;
        }
        await this.profileRepo.save(profile);
        if (galleryUrls && galleryUrls.length > 0) {
            for (const item of galleryUrls) {
                const galleryItem = this.galleryRepo.create({
                    url: item.url,
                    public_id: item.public_id,
                    profile,
                });
                await this.galleryRepo.save(galleryItem);
            }
        }
        return this.findByUserId(userId);
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