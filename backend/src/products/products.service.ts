import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductStatus } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ArtisansService } from '../artisans/artisans.service';
import { ArtisanStatus } from '../artisans/entities/artisan-profile.entity';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly imageRepo: Repository<ProductImage>,
    private readonly artisansService: ArtisansService,
  ) {}

  async create(userId: string, data: any) {
    const profile = await this.artisansService.findByUserId(userId);
    if (!profile) throw new ForbiddenException('Solo artesanos pueden crear productos');
    if (profile.verification_status === ArtisanStatus.SUSPENDED) {
      throw new ForbiddenException('Tu cuenta se encuentra suspendida y no puede publicar productos');
    }

    let slug = slugify(data.name!);
    const existing = await this.productRepo.findOneBy({ slug });
    if (existing) slug = `${slug}-${Date.now()}`;

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
      status: ProductStatus.PUBLISHED,
    });
    return this.productRepo.save(product);
  }

  async findBySlug(slug: string) {
    const product = await this.productRepo.findOne({
      where: { slug },
      relations: ['artisan', 'artisan.user', 'artisan.region', 'category', 'region', 'images', 'reviews'],
    });
    if (!product || product.artisan.verification_status === ArtisanStatus.SUSPENDED) throw new NotFoundException('Producto no encontrado');
    (product.artisan as any).status = product.artisan.verification_status;
    return product;
  }

  async update(productId: string, userId: string, data: any) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['artisan', 'artisan.user']
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (product.artisan.user.id !== userId) throw new ForbiddenException('No puedes editar este producto');

    if (data.name && data.name !== product.name) {
      let slug = slugify(data.name);
      const existing = await this.productRepo.findOneBy({ slug });
      if (existing && existing.id !== product.id) slug = `${slug}-${Date.now()}`;
      data.slug = slug;
    }

    const updatePayload: any = {
      name: data.name,
      slug: data.slug,
      price: data.price,
      stock: data.stock,
      cultural_origin: data.cultural_origin,
      technique: data.technique,
      significance: data.significance,
      short_description: data.short_description,
      materials: data.materials,
      dimensions: data.dimensions,
      weight: data.weight,
      care_instructions: data.care_instructions,
      is_handmade: data.is_handmade,
    };

    if (data.category_id) updatePayload.category = { id: data.category_id };
    if (data.region_id) updatePayload.region = { id: data.region_id };

    await this.productRepo.update(productId, updatePayload);

    return this.productRepo.findOne({ where: { id: productId }, relations: ['images'] });
  }

  async findByArtisan(userId: string) {
    const profile = await this.artisansService.findByUserId(userId);
    if (!profile) return [];
    return this.productRepo.find({
      where: { artisan: { id: profile.id } },
      relations: ['category', 'region', 'images'],
      order: { created_at: 'DESC' },
    });
  }

  async addImages(productId: string, userId: string, images: { url: string; publicId: string }[]) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['artisan', 'artisan.user'],
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (product.artisan.user.id !== userId) throw new ForbiddenException();
    const saved: ProductImage[] = [];
    for (const img of images) {
      const image = this.imageRepo.create({ url: img.url, public_id: img.publicId, product });
      saved.push(await this.imageRepo.save(image));
    }
    return saved;
  }

  async findAll() {
    return this.productRepo.find({
      relations: ['artisan', 'artisan.user', 'category', 'region'],
      order: { created_at: 'DESC' },
    });
  }

  async hide(id: string) {
    await this.productRepo.update(id, { status: ProductStatus.HIDDEN });
    return this.productRepo.findOneBy({ id });
  }

  async remove(id: string) {
    const product = await this.productRepo.findOneBy({ id });
    if (!product) throw new NotFoundException('Producto no encontrado');
    await this.productRepo.remove(product);
  }

  async findFiltered(query?: string, featured?: boolean, limit?: number) {
    const qb = this.productRepo.createQueryBuilder('product')
      .leftJoinAndSelect('product.artisan', 'artisan')
      .leftJoinAndSelect('artisan.user', 'user')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.reviews', 'reviews')
      .where('product.status = :status', { status: ProductStatus.PUBLISHED })
      .andWhere('artisan.verification_status != :suspended', { suspended: ArtisanStatus.SUSPENDED });

    if (query) {
      qb.andWhere('(product.name ILIKE :q OR product.cultural_origin ILIKE :q)', { q: `%${query}%` });
    }

    if (featured) {
      qb.orderBy('product.created_at', 'DESC'); // For now, featured = recent
    }

    if (limit) {
      qb.take(limit);
    }

    const products = await qb.getMany();
    return products.map((product) => {
      (product.artisan as any).status = product.artisan.verification_status;
      return product;
    });
  }

  async getCount() {
    return this.productRepo.count();
  }
}
