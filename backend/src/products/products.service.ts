import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductStatus } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ArtisansService } from '../artisans/artisans.service';
import { ArtisanStatus } from '../artisans/entities/artisan-profile.entity';
import { TranslationService } from './translation.service';

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
    private readonly translationService: TranslationService,
  ) {}

  async create(userId: string, data: any): Promise<Product> {
    const translatedData =
      await this.translationService.translateProductToEnglish(data);
    const profile = await this.artisansService.findByUserId(userId);
    if (!profile)
      throw new ForbiddenException('Solo artesanos pueden crear productos');
    if (profile.verification_status === ArtisanStatus.SUSPENDED) {
      throw new ForbiddenException(
        'Tu cuenta se encuentra suspendida y no puede publicar productos',
      );
    }

    let slug = slugify(translatedData.name);
    const existing = await this.productRepo.findOneBy({ slug });
    if (existing) slug = `${slug}-${Date.now()}`;

    const metaTitle =
      translatedData.meta_title || `${translatedData.name} | Art Huila`;
    const metaTitleEn =
      translatedData.meta_title_en ||
      (translatedData.name_en ? `${translatedData.name_en} | Art Huila` : null);
    const metaDesc =
      translatedData.meta_description ||
      `Artesanía ${translatedData.name} del Huila, Colombia.`;

    const metaDescEn =
      translatedData.meta_description_en ||
      translatedData.short_description_en ||
      (translatedData.name_en
        ? `Handmade craft ${translatedData.name_en} from Huila, Colombia.`
        : null);

    const product = this.productRepo.create({
      ...translatedData,
      category: translatedData.category_id
        ? { id: translatedData.category_id }
        : undefined,
      region: translatedData.region_id ? { id: translatedData.region_id } : undefined,
      slug,
      meta_title: metaTitle,
      meta_title_en: metaTitleEn,
      meta_description: metaDesc,
      meta_description_en: metaDescEn,
      artisan: profile,
      status: ProductStatus.PUBLISHED,
    });
    return this.productRepo.save(product) as any;
  }

  async findBySlug(slug: string) {
    const product = await this.productRepo.findOne({
      where: { slug },
      relations: [
        'artisan',
        'artisan.user',
        'artisan.region',
        'category',
        'region',
        'images',
        'reviews',
      ],
    });
    if (
      !product ||
      product.artisan.verification_status === ArtisanStatus.SUSPENDED
    )
      throw new NotFoundException('Producto no encontrado');
    (product.artisan as any).status = product.artisan.verification_status;
    return product;
  }

  async update(productId: string, userId: string, data: any) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['artisan', 'artisan.user'],
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (product.artisan.user.id !== userId)
      throw new ForbiddenException('No puedes editar este producto');

    data = await this.translationService.translateProductToEnglish(data);

    if (data.name && data.name !== product.name) {
      let slug = slugify(data.name);
      const existing = await this.productRepo.findOneBy({ slug });
      if (existing && existing.id !== product.id)
        slug = `${slug}-${Date.now()}`;
      data.slug = slug;
    }

    const updatePayload: any = {
      name: data.name,
      name_en: data.name_en,
      slug: data.slug,
      price: data.price,
      stock: data.stock,
      cultural_origin: data.cultural_origin,
      cultural_origin_en: data.cultural_origin_en,
      technique: data.technique,
      technique_en: data.technique_en,
      significance: data.significance,
      significance_en: data.significance_en,
      short_description: data.short_description,
      short_description_en: data.short_description_en,
      materials: data.materials,
      materials_en: data.materials_en,
      dimensions: data.dimensions,
      dimensions_en: data.dimensions_en,
      weight: data.weight,
      weight_en: data.weight_en,
      care_instructions: data.care_instructions,
      care_instructions_en: data.care_instructions_en,
      meta_title: data.meta_title,
      meta_title_en: data.meta_title_en,
      meta_description: data.meta_description,
      meta_description_en: data.meta_description_en,
      is_handmade: data.is_handmade,
    };

    if (data.category_id) updatePayload.category = { id: data.category_id };
    if (data.region_id) updatePayload.region = { id: data.region_id };

    await this.productRepo.update(productId, updatePayload);

    return this.productRepo.findOne({
      where: { id: productId },
      relations: ['images'],
    });
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

  async addImages(
    productId: string,
    userId: string,
    images: { url: string; publicId: string }[],
  ) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['artisan', 'artisan.user'],
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (product.artisan.user.id !== userId) throw new ForbiddenException();
    const saved: ProductImage[] = [];
    for (const img of images) {
      const image = this.imageRepo.create({
        url: img.url,
        public_id: img.publicId,
        product,
      });
      saved.push(await this.imageRepo.save(image));
    }
    return saved;
  }

  async removeImage(productId: string, imageId: string, userId: string) {
    // Verify the product belongs to this artisan
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['artisan', 'artisan.user', 'images'],
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (product.artisan.user.id !== userId)
      throw new ForbiddenException('No tienes permiso para eliminar esta imagen');

    const image = product.images.find((img) => img.id === imageId);
    if (!image) throw new NotFoundException('Imagen no encontrada');

    await this.imageRepo.remove(image);
    return { success: true, imageId };
  }

  async findAll() {
    return this.productRepo.find({
      relations: ['artisan', 'artisan.user', 'category', 'region'],
      order: { created_at: 'DESC' },
    });
  }

  async findForSitemap() {
    return this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.artisan', 'artisan')
      .leftJoinAndSelect('artisan.user', 'user')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.region', 'region')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.status = :status', { status: ProductStatus.PUBLISHED })
      .andWhere('artisan.verification_status != :suspended', {
        suspended: ArtisanStatus.SUSPENDED,
      })
      .orderBy('product.updated_at', 'DESC')
      .getMany();
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
    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.artisan', 'artisan')
      .leftJoinAndSelect('artisan.user', 'user')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.reviews', 'reviews')
      .where('product.status = :status', { status: ProductStatus.PUBLISHED })
      .andWhere('artisan.verification_status != :suspended', {
        suspended: ArtisanStatus.SUSPENDED,
      });

    if (query) {
      qb.andWhere(
        '(product.name ILIKE :q OR product.name_en ILIKE :q OR product.cultural_origin ILIKE :q OR product.cultural_origin_en ILIKE :q OR product.short_description ILIKE :q OR product.short_description_en ILIKE :q)',
        { q: `%${query}%` },
      );
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
