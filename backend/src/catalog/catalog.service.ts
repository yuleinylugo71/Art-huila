import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductStatus } from '../products/entities/product.entity';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAll(params: {
    regions?: string[];
    categories?: string[];
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    page?: number;
    limit?: number;
    artisanId?: string;
  }) {
    const { regions, categories, minPrice, maxPrice, sortBy = 'newest', page = 1, limit = 20, artisanId } = params;

    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.artisan', 'artisan')
      .leftJoinAndSelect('artisan.user', 'artisan_user')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.region', 'region')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.status = :status', { status: ProductStatus.PUBLISHED });

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

    if (sortBy === 'price_asc') qb.orderBy('product.price', 'ASC');
    else if (sortBy === 'price_desc') qb.orderBy('product.price', 'DESC');
    else qb.orderBy('product.created_at', 'DESC');

    const total = await qb.getCount();
    const data = await qb.skip((page - 1) * limit).take(limit).getMany();

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
