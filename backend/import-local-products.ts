import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { User } from './src/users/entities/user.entity';
import { UserRole } from './src/common/constants';
import { Category } from './src/categories/entities/category.entity';
import { Region } from './src/regions/entities/region.entity';
import { ArtisanProfile, VerificationStatus } from './src/artisans/entities/artisan-profile.entity';
import { ArtisanGallery } from './src/artisans/entities/artisan-gallery.entity';
import { Product, ProductStatus } from './src/products/entities/product.entity';
import { ProductImage } from './src/products/entities/product-image.entity';
import { Review } from './src/reviews/entities/review.entity';
import { Order } from './src/orders/entities/order.entity';
import { OrderItem } from './src/orders/entities/order-item.entity';
import { AdminAuditLog } from './src/audit/entities/admin-audit-log.entity';

type ImportData = {
  categories: Array<{ name: string; description?: string }>;
  regions: Array<{ name: string; description?: string }>;
  artisans: Array<{
    full_name: string;
    email: string;
    id_number: string;
    cultural_history?: string;
    verification_status?: VerificationStatus;
    truthfulness_declaration?: boolean;
    category?: string;
    region?: string;
    avatar_url?: string | null;
  }>;
  products: Array<{
    name: string;
    slug: string;
    price: string | number;
    stock: number;
    cultural_origin?: string;
    technique?: string;
    significance?: string;
    status?: ProductStatus;
    meta_title?: string;
    meta_description?: string;
    short_description?: string;
    materials?: string;
    dimensions?: string;
    weight?: string;
    care_instructions?: string;
    is_handmade?: boolean;
    category?: string;
    region?: string;
    artisan_email: string;
    images: Array<{ url: string; public_id?: string }>;
  }>;
};

const dataPath = path.resolve(process.cwd(), 'product-import-data.json');

async function importProducts() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8')) as ImportData;
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [
      User,
      Category,
      Region,
      ArtisanProfile,
      ArtisanGallery,
      Product,
      ProductImage,
      Review,
      Order,
      OrderItem,
      AdminAuditLog,
    ],
    synchronize: false,
  });

  await dataSource.initialize();

  const categoryRepo = dataSource.getRepository(Category);
  const regionRepo = dataSource.getRepository(Region);
  const userRepo = dataSource.getRepository(User);
  const artisanRepo = dataSource.getRepository(ArtisanProfile);
  const productRepo = dataSource.getRepository(Product);
  const imageRepo = dataSource.getRepository(ProductImage);

  const categories = new Map<string, Category>();
  for (const row of data.categories) {
    let category = await categoryRepo.findOneBy({ name: row.name });
    if (!category) {
      category = await categoryRepo.save(categoryRepo.create(row));
    }
    categories.set(row.name, category);
  }

  const regions = new Map<string, Region>();
  for (const row of data.regions) {
    let region = await regionRepo.findOneBy({ name: row.name });
    if (!region) {
      region = await regionRepo.save(regionRepo.create(row));
    }
    regions.set(row.name, region);
  }

  const fallbackPassword = await bcrypt.hash('Cambiar123!', 10);
  const artisans = new Map<string, ArtisanProfile>();
  for (const row of data.artisans) {
    let user = await userRepo.findOneBy({ email: row.email });
    if (!user) {
      user = await userRepo.save(
        userRepo.create({
          full_name: row.full_name,
          email: row.email,
          password_hash: fallbackPassword,
          role: UserRole.ARTISAN,
          email_verified: true,
        }),
      );
    }

    let artisan = await artisanRepo.findOne({
      where: { user: { id: user.id } },
      relations: ['user'],
    });

    if (!artisan) {
      artisan = await artisanRepo.save(
        artisanRepo.create({
          user,
          id_number: row.id_number,
          cultural_history:
            row.cultural_history || `Historia artesanal de ${row.full_name}.`,
          verification_status:
            row.verification_status || VerificationStatus.VERIFIED,
          truthfulness_declaration: row.truthfulness_declaration ?? true,
          category: row.category ? categories.get(row.category) : undefined,
          region: row.region ? regions.get(row.region) : undefined,
          avatar_url: row.avatar_url || undefined,
        }),
      );
    }

    artisans.set(row.email, artisan);
  }

  await dataSource.query(`DELETE FROM "${imageRepo.metadata.tableName}"`);
  await dataSource.query(`DELETE FROM "${productRepo.metadata.tableName}"`);

  let count = 0;
  for (const row of data.products) {
    const artisan = artisans.get(row.artisan_email);
    if (!artisan) {
      throw new Error(`Missing artisan for ${row.artisan_email}`);
    }

    const product = (await productRepo.save(
      productRepo.create({
        name: row.name,
        slug: row.slug,
        price: Number(row.price),
        stock: row.stock,
        cultural_origin: row.cultural_origin,
        technique: row.technique,
        significance: row.significance,
        status: row.status || ProductStatus.PUBLISHED,
        meta_title: row.meta_title,
        meta_description: row.meta_description,
        short_description: row.short_description,
        materials: row.materials,
        dimensions: row.dimensions,
        weight: row.weight,
        care_instructions: row.care_instructions,
        is_handmade: row.is_handmade ?? true,
        artisan,
        category: row.category ? categories.get(row.category) : undefined,
        region: row.region ? regions.get(row.region) : undefined,
      }),
    )) as Product;

    for (const image of row.images) {
      await imageRepo.save(
        imageRepo.create({
          url: image.url,
          public_id: image.public_id || image.url,
          product,
        }),
      );
    }

    count++;
  }

  await dataSource.destroy();
  console.log(`Productos importados: ${count}`);
}

importProducts().catch((error) => {
  console.error('Error importando productos:', error);
  process.exit(1);
});
