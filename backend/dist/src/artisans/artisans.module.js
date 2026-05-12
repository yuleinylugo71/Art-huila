"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtisansModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const artisan_profile_entity_1 = require("./entities/artisan-profile.entity");
const artisan_gallery_entity_1 = require("./entities/artisan-gallery.entity");
const artisans_service_1 = require("./artisans.service");
const artisans_controller_1 = require("./artisans.controller");
const cloudinary_module_1 = require("../cloudinary/cloudinary.module");
const mail_module_1 = require("../mail/mail.module");
const audit_module_1 = require("../audit/audit.module");
let ArtisansModule = class ArtisansModule {
};
exports.ArtisansModule = ArtisansModule;
exports.ArtisansModule = ArtisansModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([artisan_profile_entity_1.ArtisanProfile, artisan_gallery_entity_1.ArtisanGallery]),
            cloudinary_module_1.CloudinaryModule,
            mail_module_1.MailModule,
            audit_module_1.AuditModule,
        ],
        controllers: [artisans_controller_1.ArtisansController],
        providers: [artisans_service_1.ArtisansService],
        exports: [artisans_service_1.ArtisansService],
    })
], ArtisansModule);
//# sourceMappingURL=artisans.module.js.map