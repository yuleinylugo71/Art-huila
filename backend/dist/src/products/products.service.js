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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("./entities/product.entity");
const product_image_entity_1 = require("./entities/product-image.entity");
const artisans_service_1 = require("../artisans/artisans.service");
const artisan_profile_entity_1 = require("../artisans/entities/artisan-profile.entity");
function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}
let ProductsService = class ProductsService {
    productRepo;
    imageRepo;
    artisansService;
    constructor(productRepo, imageRepo, artisansService) {
        this.productRepo = productRepo;
        this.imageRepo = imageRepo;
        this.artisansService = artisansService;
    }
    async create(userId, data) {
        const profile = await this.artisansService.findByUserId(userId);
        if (!profile)
            throw new common_1.ForbiddenException('Solo artesanos pueden crear productos');
        if (profile.verification_status !== artisan_profile_entity_1.VerificationStatus.VERIFIED) {
            throw new common_1.ForbiddenException('Tu cuenta aún no está verificada por el administrador');
        }
        let slug = slugify(data.name);
        const existing = await this.productRepo.findOneBy({ slug });
        if (existing)
            slug = `${slug}-${Date.now()}`;
        const metaTitle = data.meta_title || `${data.name} | Art Huila`;
        const metaDesc = data.meta_description || `Artesanía ${data.name} del Huila, Colombia.`;
        const product = this.productRepo.create({
            ...data,
            category: data.category_id ? { id: data.category_id } : undefined,
            region: data.region_id ? { id: data.region_id } : undefined,
            slug,
            meta_title: metaTitle,
            meta_description: metaDesc,
            artisan: profile,
            status: product_entity_1.ProductStatus.PUBLISHED,
        });
        return this.productRepo.save(product);
    }
    async findBySlug(slug) {
        const product = await this.productRepo.findOne({
            where: { slug },
            relations: ['artisan', 'artisan.user', 'artisan.region', 'category', 'region', 'images'],
        });
        if (!product)
            throw new common_1.NotFoundException('Producto no encontrado');
        return product;
    }
    async update(productId, userId, data) {
        const product = await this.productRepo.findOne({
            where: { id: productId },
            relations: ['artisan', 'artisan.user']
        });
        if (!product)
            throw new common_1.NotFoundException('Producto no encontrado');
        if (product.artisan.user.id !== userId)
            throw new common_1.ForbiddenException('No puedes editar este producto');
        if (data.name && data.name !== product.name) {
            let slug = slugify(data.name);
            const existing = await this.productRepo.findOneBy({ slug });
            if (existing && existing.id !== product.id)
                slug = `${slug}-${Date.now()}`;
            data.slug = slug;
        }
        const updatePayload = {
            name: data.name,
            slug: data.slug,
            price: data.price,
            stock: data.stock,
            cultural_origin: data.cultural_origin,
            technique: data.technique,
            significance: data.significance,
        };
        if (data.category_id)
            updatePayload.category = { id: data.category_id };
        if (data.region_id)
            updatePayload.region = { id: data.region_id };
        await this.productRepo.update(productId, updatePayload);
        return this.productRepo.findOne({ where: { id: productId }, relations: ['images'] });
    }
    async findByArtisan(userId) {
        const profile = await this.artisansService.findByUserId(userId);
        if (!profile)
            return [];
        return this.productRepo.find({
            where: { artisan: { id: profile.id } },
            relations: ['category', 'region', 'images'],
            order: { created_at: 'DESC' },
        });
    }
    async addImages(productId, userId, images) {
        const product = await this.productRepo.findOne({
            where: { id: productId },
            relations: ['artisan', 'artisan.user'],
        });
        if (!product)
            throw new common_1.NotFoundException('Producto no encontrado');
        if (product.artisan.user.id !== userId)
            throw new common_1.ForbiddenException();
        const saved = [];
        for (const img of images) {
            const image = this.imageRepo.create({ url: img.url, public_id: img.publicId, product });
            saved.push(await this.imageRepo.save(image));
        }
        return saved;
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(product_image_entity_1.ProductImage)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        artisans_service_1.ArtisansService])
], ProductsService);
//# sourceMappingURL=products.service.js.map