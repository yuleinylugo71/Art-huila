import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductStatus } from '../products/entities/product.entity';
import { ArtisanStatus } from '../artisans/entities/artisan-profile.entity';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAll(params: {
    regions?: string[];
    categories?: string[];
    materials?: string[];
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    page?: number;
    limit?: number;
    artisanId?: string;
    search?: string;
  }) {
    const { regions, categories, materials, minPrice, maxPrice, sortBy = 'newest', page = 1, limit = 20, artisanId, search } = params;

    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.artisan', 'artisan')
      .leftJoinAndSelect('artisan.user', 'artisan_user')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.region', 'region')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.reviews', 'reviews')
      .where('product.status = :status', { status: ProductStatus.PUBLISHED })
      .andWhere('artisan.verification_status != :suspended', { suspended: ArtisanStatus.SUSPENDED });

    if (search) {
      qb.andWhere(
        '(product.name ILIKE :search OR product.cultural_origin ILIKE :search OR artisan_user.full_name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (artisanId) {
      qb.andWhere('artisan.id = :artisanId', { artisanId });
    }
    if (regions && regions.length > 0) {
      qb.andWhere('region.name IN (:...regions)', { regions });
    }
    if (categories && categories.length > 0) {
      qb.andWhere('category.name IN (:...categories)', { categories });
    }
    if (materials && materials.length > 0) {
      const materialConditions = materials.map((m, idx) => `product.materials ILIKE :material_${idx}`);
      const parameters = {};
      materials.forEach((m, idx) => {
        parameters[`material_${idx}`] = `%${m}%`;
      });
      qb.andWhere(`(${materialConditions.join(' OR ')})`, parameters);
    }
    if (minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    if (sortBy === 'price_asc') qb.orderBy('product.price', 'ASC');
    else if (sortBy === 'price_desc') qb.orderBy('product.price', 'DESC');
    else qb.orderBy('product.created_at', 'DESC');

    const total = await qb.getCount();
    const rawData = await qb.skip((page - 1) * limit).take(limit).getMany();
    const data = rawData.map((product) => {
      (product.artisan as any).status = product.artisan.verification_status;
      const reviews = product.reviews || [];
      const reviewCount = reviews.length;
      const avgRating = reviewCount > 0
        ? parseFloat((reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1))
        : 0;
      (product as any).rating = avgRating;
      (product as any).review_count = reviewCount;
      return product;
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
