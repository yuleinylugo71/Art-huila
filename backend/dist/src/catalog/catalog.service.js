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
exports.CatalogService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("../products/entities/product.entity");
let CatalogService = class CatalogService {
    productRepo;
    constructor(productRepo) {
        this.productRepo = productRepo;
    }
    async findAll(params) {
        const { regions, categories, minPrice, maxPrice, sortBy = 'newest', page = 1, limit = 20, artisanId } = params;
        const qb = this.productRepo
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.artisan', 'artisan')
            .leftJoinAndSelect('artisan.user', 'artisan_user')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.region', 'region')
            .leftJoinAndSelect('product.images', 'images')
            .where('product.status = :status', { status: product_entity_1.ProductStatus.PUBLISHED });
        if (artisanId) {
            qb.andWhere('artisan.id = :artisanId', { artisanId });
        }
        if (regions && regions.length > 0) {
            qb.andWhere('region.name IN (:...regions)', { regions });
        }
        if (categories && categories.length > 0) {
            qb.andWhere('category.name IN (:...categories)', { categories });
        }
        if (minPrice !== undefined) {
            qb.andWhere('product.price >= :minPrice', { minPrice });
        }
        if (maxPrice !== undefined) {
            qb.andWhere('product.price <= :maxPrice', { maxPrice });
        }
        if (sortBy === 'price_asc')
            qb.orderBy('product.price', 'ASC');
        else if (sortBy === 'price_desc')
            qb.orderBy('product.price', 'DESC');
        else
            qb.orderBy('product.created_at', 'DESC');
        const total = await qb.getCount();
        const data = await qb.skip((page - 1) * limit).take(limit).getMany();
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
};
exports.CatalogService = CatalogService;
exports.CatalogService = CatalogService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CatalogService);
//# sourceMappingURL=catalog.service.js.map