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
exports.ArtisansController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const artisans_service_1 = require("./artisans.service");
const cloudinary_service_1 = require("../cloudinary/cloudinary.service");
let ArtisansController = class ArtisansController {
    artisansService;
    cloudinaryService;
    constructor(artisansService, cloudinaryService) {
        this.artisansService = artisansService;
        this.cloudinaryService = cloudinaryService;
    }
    async findAll(featured) {
        if (featured === 'true') {
            const artisans = await this.artisansService.findFeatured();
            return artisans.map(a => ({
                name: a.user.full_name,
                city: a.region?.name || 'Huila',
                bio: a.cultural_history.substring(0, 120) + '...',
                avatar_url: a.avatar_url,
                verified: a.verification_status === 'verified',
                status: a.verification_status,
            }));
        }
        return this.artisansService.findAll();
    }
    getMyProfile(user) {
        return this.artisansService.findByUserId(user.id);
    }
    getProfile(id) {
        return this.artisansService.findById(id);
    }
    async uploadGallery(user, files) {
        const profile = await this.artisansService.findByUserId(user.id);
        if (!profile)
            return { message: 'Profile not found' };
        const uploaded = [];
        for (const file of files) {
            const result = await this.cloudinaryService.uploadImage(file, 'arthuila/gallery');
            await this.artisansService.addGalleryImage(profile.id, result.secure_url, result.public_id);
            uploaded.push(result.secure_url);
        }
        return { uploaded };
    }
    updateProfile(user, body) {
        return this.artisansService.updateProfile(user.id, body);
    }
    async uploadAvatar(user, files) {
        if (!files || files.length === 0)
            return { message: 'No image provided' };
        const result = await this.cloudinaryService.uploadImage(files[0], 'arthuila/avatars');
        await this.artisansService.updateProfile(user.id, { avatar_url: result.secure_url });
        return { avatar_url: result.secure_url };
    }
    async uploadDocumentFront(user, files) {
        if (!files || files.length === 0)
            return { message: 'No file provided' };
        const result = await this.cloudinaryService.uploadImage(files[0], 'arthuila/documents');
        await this.artisansService.updateProfile(user.id, { id_document_front_url: result.secure_url });
        return { id_document_front_url: result.secure_url };
    }
    async uploadDocumentBack(user, files) {
        if (!files || files.length === 0)
            return { message: 'No file provided' };
        const result = await this.cloudinaryService.uploadImage(files[0], 'arthuila/documents');
        await this.artisansService.updateProfile(user.id, { id_document_back_url: result.secure_url });
        return { id_document_back_url: result.secure_url };
    }
};
exports.ArtisansController = ArtisansController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('featured')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ArtisansController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ArtisansController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ArtisansController.prototype, "getProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('me/gallery'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('images', 10)),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Array]),
    __metadata("design:returntype", Promise)
], ArtisansController.prototype, "uploadGallery", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ArtisansController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('me/avatar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('image', 1)),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Array]),
    __metadata("design:returntype", Promise)
], ArtisansController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('me/document-front'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('document', 1)),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Array]),
    __metadata("design:returntype", Promise)
], ArtisansController.prototype, "uploadDocumentFront", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('me/document-back'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('document', 1)),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Array]),
    __metadata("design:returntype", Promise)
], ArtisansController.prototype, "uploadDocumentBack", null);
exports.ArtisansController = ArtisansController = __decorate([
    (0, common_1.Controller)('artisans'),
    __metadata("design:paramtypes", [artisans_service_1.ArtisansService,
        cloudinary_service_1.CloudinaryService])
], ArtisansController);
//# sourceMappingURL=artisans.controller.js.map