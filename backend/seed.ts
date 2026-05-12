import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import { User, UserRole } from './src/users/entities/user.entity';
import { Category } from './src/categories/entities/category.entity';
import { Region } from './src/regions/entities/region.entity';
import { ArtisanProfile, VerificationStatus } from './src/artisans/entities/artisan-profile.entity';
import { ArtisanGallery } from './src/artisans/entities/artisan-gallery.entity';
import { Product, ProductStatus } from './src/products/entities/product.entity';
import { ProductImage } from './src/products/entities/product-image.entity';
import { AdminAuditLog } from './src/audit/entities/admin-audit-log.entity';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const seedDatabase = async () => {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgresql://postgres:0408@localhost:5432/arthuila',
    entities: [User, Category, Region, ArtisanProfile, ArtisanGallery, Product, ProductImage, AdminAuditLog],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('✅ Database connected for seeding...');

  // --- Seed Categories ---
  const categoryRepo = dataSource.getRepository(Category);
  const categoryNames = ['Tejeduría', 'Cerámica', 'Talla en madera', 'Orfebrería', 'Sombrerería'];
  const categories: Category[] = [];
  for (const name of categoryNames) {
    let cat = await categoryRepo.findOneBy({ name });
    if (!cat) {
      cat = categoryRepo.create({ name, description: `Artesanía de ${name} del Huila` });
      await categoryRepo.save(cat);
    }
    categories.push(cat);
  }
  console.log('✅ Categories seeded.');

  // --- Seed Regions ---
  const regionRepo = dataSource.getRepository(Region);
  const regionNames = ['Neiva', 'Pitalito', 'Garzón', 'La Plata', 'Campoalegre', 'Rivera', 'Agrado', 'Isnos'];
  const regions: Region[] = [];
  for (const name of regionNames) {
    let reg = await regionRepo.findOneBy({ name });
    if (!reg) {
      reg = regionRepo.create({ name, description: `Municipio de ${name}, Huila` });
      await regionRepo.save(reg);
    }
    regions.push(reg);
  }
  console.log('✅ Regions seeded.');

  // --- Seed Admin User ---
  const userRepo = dataSource.getRepository(User);
  let admin = await userRepo.findOneBy({ email: 'admin@arthuila.com' });
  if (!admin) {
    admin = userRepo.create({
      full_name: 'Administrador Art Huila',
      email: 'admin@arthuila.com',
      password_hash: await bcrypt.hash('Admin1234!', 10),
      role: UserRole.ADMIN,
    });
    await userRepo.save(admin);
    console.log('✅ Admin user seeded: admin@arthuila.com / Admin1234!');
  }

  // --- Seed Artisan Users ---
  const artisanRepo = dataSource.getRepository(ArtisanProfile);
  const artisansData = [
    { name: 'Rosa Elena Vargas', email: 'rosa@artesano.com', status: VerificationStatus.VERIFIED, idNum: '10234567', cat: 0, reg: 0 },
    { name: 'Carlos Murcia', email: 'carlos@artesano.com', status: VerificationStatus.PENDING, idNum: '20345678', cat: 1, reg: 1 },
  ];

  const artisanProfiles: ArtisanProfile[] = [];
  for (const aData of artisansData) {
    let user = await userRepo.findOneBy({ email: aData.email });
    if (!user) {
      user = userRepo.create({
        full_name: aData.name,
        email: aData.email,
        password_hash: await bcrypt.hash('Artesano123!', 10),
        role: UserRole.ARTISAN,
      });
      await userRepo.save(user);
    }

    let profile = await artisanRepo.findOne({ where: { id_number: aData.idNum } });
    if (!profile) {
      profile = artisanRepo.create({
        user,
        id_number: aData.idNum,
        cultural_history: `Historia y tradición artesanal de ${aData.name}. Oficio transmitido de generación en generación en el departamento del Huila.`,
        category: categories[aData.cat],
        region: regions[aData.reg],
        verification_status: aData.status,
        truthfulness_declaration: true,
      });
      await artisanRepo.save(profile);
    }
    artisanProfiles.push(profile);
  }
  console.log('✅ Artisans seeded.');

  // --- Seed Products ---
  const productRepo = dataSource.getRepository(Product);
  const imageRepo = dataSource.getRepository(ProductImage);

  const verifiedArtisan = artisanProfiles.find(p => p.verification_status === VerificationStatus.VERIFIED);
  if (verifiedArtisan) {
    const productsData = [
      { name: 'Mochila Wayuu Tejida', price: 180000, stock: 15, cat: 0, sig: 'Símbolo de identidad cultural' },
      { name: 'Vasija de Cerámica Huilense', price: 95000, stock: 8, cat: 1, sig: 'Representación de la cosmovisión indígena' },
      { name: 'Talla de Madera Amazónica', price: 240000, stock: 5, cat: 2, sig: 'Arte ancestral de las comunidades del sur del Huila' },
      { name: 'Collar de Orfebrería en Filigrana', price: 320000, stock: 3, cat: 3, sig: 'Herencia de los orfebres de la región andina' },
      { name: 'Sombrero Vueltiao Huilense', price: 125000, stock: 20, cat: 4, sig: 'Tradición de tejedores del Huila' },
    ];

    for (const pd of productsData) {
      const slug = pd.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      let product = await productRepo.findOneBy({ slug });
      if (!product) {
        product = productRepo.create({
          name: pd.name,
          slug,
          price: pd.price,
          stock: pd.stock,
          artisan: verifiedArtisan,
          category: categories[pd.cat],
          region: verifiedArtisan.region,
          cultural_origin: `Originado en las comunidades artesanales de Neiva, Huila`,
          technique: `Técnica manual transmitida de generación en generación`,
          significance: pd.sig,
          status: ProductStatus.PUBLISHED,
          meta_title: `${pd.name} | Art Huila`,
          meta_description: `Descubre ${pd.name}, una pieza artesanal auténtica del Huila, Colombia.`,
        });
        await productRepo.save(product);

        const img = imageRepo.create({
          url: `https://res.cloudinary.com/dcoj4c3ay/image/upload/v1/arthuila/sample`,
          public_id: `arthuila/sample_${slug}`,
          product,
        });
        await imageRepo.save(img);
      }
    }
    console.log('✅ Products seeded.');
  }

  await dataSource.destroy();
  console.log('\n🎉 Database seeding completed successfully!\n');
  console.log('Credentials:');
  console.log('  Admin:    admin@arthuila.com / Admin1234!');
  console.log('  Artisan:  rosa@artesano.com / Artesano123!');
};

seedDatabase().catch(err => {
  console.error('Error during seeding:', err.message);
  process.exit(1);
});
