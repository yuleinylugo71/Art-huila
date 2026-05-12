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
exports.ArtisanGallery = void 0;
const typeorm_1 = require("typeorm");
const artisan_profile_entity_1 = require("./artisan-profile.entity");
let ArtisanGallery = class ArtisanGallery {
    id;
    url;
    public_id;
    profile;
    created_at;
};
exports.ArtisanGallery = ArtisanGallery;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ArtisanGallery.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ArtisanGallery.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ArtisanGallery.prototype, "public_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => artisan_profile_entity_1.ArtisanProfile, profile => profile.gallery, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", artisan_profile_entity_1.ArtisanProfile)
], ArtisanGallery.prototype, "profile", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ArtisanGallery.prototype, "created_at", void 0);
exports.ArtisanGallery = ArtisanGallery = __decorate([
    (0, typeorm_1.Entity)('artisan_gallery')
], ArtisanGallery);
//# sourceMappingURL=artisan-gallery.entity.js.map