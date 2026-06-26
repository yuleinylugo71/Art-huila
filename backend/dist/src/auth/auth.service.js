"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const users_service_1 = require("../users/users.service");
const mail_service_1 = require("../mail/mail.service");
const user_entity_1 = require("../users/entities/user.entity");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cloudinary_1 = require("cloudinary");
const stream_1 = require("stream");
const artisan_profile_entity_1 = require("../artisans/entities/artisan-profile.entity");
const category_entity_1 = require("../categories/entities/category.entity");
const region_entity_1 = require("../regions/entities/region.entity");
const artisan_gallery_entity_1 = require("../artisans/entities/artisan-gallery.entity");
const refresh_token_entity_1 = require("./entities/refresh-token.entity");
let AuthService = class AuthService {
    usersService;
    jwtService;
    configService;
    mailService;
    artisanRepo;
    categoryRepo;
    regionRepo;
    refreshTokenRepo;
    constructor(usersService, jwtService, configService, mailService, artisanRepo, categoryRepo, regionRepo, refreshTokenRepo) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.mailService = mailService;
        this.artisanRepo = artisanRepo;
        this.categoryRepo = categoryRepo;
        this.regionRepo = regionRepo;
        this.refreshTokenRepo = refreshTokenRepo;
        cloudinary_1.v2.config({
            cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.get('CLOUDINARY_API_KEY'),
            api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
        });
    }
    async uploadToCloudinary(file, folder) {
        return new Promise((resolve, reject) => {
            const upload = cloudinary_1.v2.uploader.upload_stream({ folder, resource_type: 'auto' }, (error, result) => {
                if (error)
                    return reject(error);
                resolve(result);
            });
            const readable = new stream_1.Readable();
            readable.push(file.buffer);
            readable.push(null);
            readable.pipe(upload);
        });
    }
    generateTokens(userId, role) {
        const payload = { sub: userId, role };
        const access_token = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: '24h',
        });
        const refresh_token = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
        });
        return { access_token, refresh_token };
    }
    async login(dto) {
        const user = await this.usersService.findByEmail(dto.email);
        const invalidMsg = 'Credenciales incorrectas';
        if (!user)
            throw new common_1.UnauthorizedException(invalidMsg);
        if (user.role === user_entity_1.UserRole.ARTISAN) {
            const profile = await this.artisanRepo.findOne({ where: { user: { id: user.id } } });
            if (profile?.verification_status === artisan_profile_entity_1.ArtisanStatus.SUSPENDED) {
                throw new common_1.UnauthorizedException('Tu cuenta de artesano se encuentra suspendida');
            }
        }
        if (user.locked_until && user.locked_until > new Date()) {
            const minutesLeft = Math.ceil((user.locked_until.getTime() - Date.now()) / 60000);
            throw new common_1.UnauthorizedException(`Cuenta bloqueada. Intenta en ${minutesLeft} minuto(s)`);
        }
        const passwordMatch = await bcrypt.compare(dto.password, user.password_hash);
        if (!passwordMatch) {
            await this.usersService.incrementFailedLogins(user.id);
            throw new common_1.UnauthorizedException(invalidMsg);
        }
        await this.usersService.resetFailedLogins(user.id);
        const tokens = this.generateTokens(user.id, user.role);
        return {
            ...tokens,
            user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
        };
    }
    async registerBuyer(dto) {
        const passwordHash = await bcrypt.hash(dto.password, 10);
        await this.usersService.create({
            full_name: dto.full_name,
            email: dto.email,
            password_hash: passwordHash,
            role: user_entity_1.UserRole.BUYER,
            email_verified: true,
        });
        return { message: 'Registro exitoso. ¡Bienvenido!' };
    }
    async registerArtisan(dto, idDocumentFrontFile, idDocumentBackFile, galleryFiles, clientIp) {
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date();
        expires.setHours(expires.getHours() + 48);
        const category = await this.categoryRepo.findOneBy({ id: dto.category_id });
        if (!category)
            throw new common_1.BadRequestException('Categoría no válida');
        const region = await this.regionRepo.findOneBy({ id: dto.region_id });
        if (!region)
            throw new common_1.BadRequestException('Región no válida');
        const existingArtisan = await this.artisanRepo.findOne({ where: { id_number: dto.id_number } });
        if (existingArtisan) {
            throw new common_1.ConflictException('El número de cédula (ID) ya se encuentra registrado');
        }
        let idDocumentFrontUrl = null;
        if (idDocumentFrontFile) {
            const upload = await this.uploadToCloudinary(idDocumentFrontFile, 'artisans/documents');
            idDocumentFrontUrl = upload.secure_url;
        }
        let idDocumentBackUrl = null;
        if (idDocumentBackFile) {
            const upload = await this.uploadToCloudinary(idDocumentBackFile, 'artisans/documents');
            idDocumentBackUrl = upload.secure_url;
        }
        const user = await this.usersService.create({
            full_name: dto.full_name,
            email: dto.email,
            password_hash: passwordHash,
            role: user_entity_1.UserRole.ARTISAN,
            email_verified: false,
            email_verification_token: verificationToken,
            email_token_expires_at: expires,
        });
        const profile = this.artisanRepo.create({
            user,
            id_number: dto.id_number,
            cultural_history: dto.cultural_history,
            category,
            region,
            verification_status: artisan_profile_entity_1.ArtisanStatus.PENDING,
            truthfulness_declaration: dto.truthfulness_declaration === 'true',
            id_document_front_url: idDocumentFrontUrl,
            id_document_back_url: idDocumentBackUrl,
            legal_acceptance_ip: clientIp || null,
            legal_acceptance_timestamp: new Date(),
        });
        const savedProfile = await this.artisanRepo.save(profile);
        if (galleryFiles && galleryFiles.length > 0) {
            for (const file of galleryFiles) {
                const upload = await this.uploadToCloudinary(file, 'artisans/gallery');
                await this.artisanRepo.manager.save(artisan_gallery_entity_1.ArtisanGallery, {
                    url: upload.secure_url,
                    public_id: upload.public_id,
                    profile: savedProfile,
                });
            }
        }
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
        await this.mailService.sendVerificationEmail(user.email, user.full_name, verificationToken, frontendUrl);
        return { message: 'Registro exitoso. Revisa tu email para verificar tu cuenta.' };
    }
    async verifyEmail(token) {
        const user = await this.usersService['userRepo'].findOne({
            where: { email_verification_token: token },
        });
        if (!user)
            throw new common_1.BadRequestException('Token inválido o expirado');
        if (user.email_token_expires_at && user.email_token_expires_at < new Date()) {
            throw new common_1.BadRequestException('El token ha expirado');
        }
        user.email_verified = true;
        user.verifiedAt = new Date();
        user.email_verification_token = undefined;
        user.email_token_expires_at = undefined;
        await this.usersService.save(user);
        const profile = await this.artisanRepo.findOne({ where: { user: { id: user.id } } });
        if (profile && profile.verification_status === artisan_profile_entity_1.ArtisanStatus.PENDING) {
            profile.verification_status = artisan_profile_entity_1.ArtisanStatus.ACTIVE;
            await this.artisanRepo.save(profile);
        }
        return { message: 'Email verificado exitosamente' };
    }
    async refresh(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
            const user = await this.usersService.findById(payload.sub);
            if (!user)
                throw new common_1.UnauthorizedException();
            return this.generateTokens(user.id, user.role);
        }
        catch {
            throw new common_1.UnauthorizedException('Token de refresco inválido');
        }
    }
    async logout(refreshToken) {
        await this.refreshTokenRepo.delete({ token: refreshToken });
        return { message: 'Sesion cerrada correctamente' };
    }
    async requestPasswordReset(email) {
        const genericMsg = 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.';
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            return { message: genericMsg };
        }
        const token = crypto.randomBytes(32).toString('hex');
        user.reset_password_token = token;
        user.reset_password_expires = new Date(Date.now() + 3600000);
        await this.usersService.save(user);
        try {
            await this.mailService.sendPasswordResetEmail(user.email, token, user.full_name);
        }
        catch (err) {
            console.error('Error sending password reset email:', err);
        }
        return { message: genericMsg };
    }
    async resetPassword(token, newPassword) {
        const user = await this.usersService.findByResetToken(token);
        if (!user || !user.reset_password_expires || user.reset_password_expires < new Date()) {
            throw new common_1.BadRequestException('Token inválido o expirado');
        }
        user.password_hash = await bcrypt.hash(newPassword, 10);
        user.reset_password_token = null;
        user.reset_password_expires = null;
        await this.usersService.save(user);
        return { message: 'Contraseña actualizada correctamente' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, typeorm_1.InjectRepository)(artisan_profile_entity_1.ArtisanProfile)),
    __param(5, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __param(6, (0, typeorm_1.InjectRepository)(region_entity_1.Region)),
    __param(7, (0, typeorm_1.InjectRepository)(refresh_token_entity_1.RefreshToken)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mail_service_1.MailService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AuthService);
//# sourceMappingURL=auth.service.js.map