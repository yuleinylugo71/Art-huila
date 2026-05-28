import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as path from 'path';
import * as XLSX from 'xlsx';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './src/users/entities/user.entity';
import { Category } from './src/categories/entities/category.entity';
import { Region } from './src/regions/entities/region.entity';
import { ArtisanProfile, ArtisanStatus } from './src/artisans/entities/artisan-profile.entity';
import { ArtisanGallery } from './src/artisans/entities/artisan-gallery.entity';
import { Product, ProductStatus } from './src/products/entities/product.entity';
import { ProductImage } from './src/products/entities/product-image.entity';
import { AdminAuditLog } from './src/audit/entities/admin-audit-log.entity';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const excelPath = 'C:\\Users\\Yuleiny\\Downloads\\Plantilla_Productos_ArtHuila_50.xlsx';

// Hermosas imágenes reales de Unsplash para cada categoría para dar una estética súper premium
const categoryImages: Record<string, string[]> = {
  'Sombrerería': [
    'https://images.unsplash.com/photo-1572307480813-ceb0e59d694b?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1533461502717-83546484078c?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1595487742435-41a026ab3310?q=80&w=600&auto=format&fit=crop'
  ],
  'Cerámica': [
    'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1565192647048-f997ed8799d4?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?q=80&w=600&auto=format&fit=crop'
  ],
  'Tejeduría': [
    'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1575844265151-518296fe7dbb?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1528731708534-816fe59f90cb?q=80&w=600&auto=format&fit=crop'
  ],
  'Talla en madera': [
    'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1546482503-934ae3fd95c5?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600&auto=format&fit=crop'
  ],
  'Orfebrería': [
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=600&auto=format&fit=crop'
  ]
};

const recoverDatabase = async () => {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgresql://postgres:0408@localhost:5432/arthuila',
    entities: [User, Category, Region, ArtisanProfile, ArtisanGallery, Product, ProductImage, AdminAuditLog],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('✅ Conectado a la base de datos para recuperación...');

  // 1. Limpiar imágenes y productos antiguos de forma segura para evitar FK crashes
  const imageTableName = dataSource.getRepository(ProductImage).metadata.tableName;
  const productTableName = dataSource.getRepository(Product).metadata.tableName;
  await dataSource.query(`DELETE FROM "${imageTableName}"`);
  await dataSource.query(`DELETE FROM "${productTableName}"`);
  console.log('🧹 Limpieza de productos antiguos completada de manera limpia.');

  // 2. Cargar el archivo Excel
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const productsList = XLSX.utils.sheet_to_json(sheet) as any[];

  console.log(`📊 Encontrados ${productsList.length} productos en el archivo Excel.`);

  const productRepo = dataSource.getRepository(Product);
  const imageRepo = dataSource.getRepository(ProductImage);
  const categoryRepo = dataSource.getRepository(Category);
  const regionRepo = dataSource.getRepository(Region);
  const artisanRepo = dataSource.getRepository(ArtisanProfile);
  const userRepo = dataSource.getRepository(User);

  // 3. Asegurar categorías en DB
  const categoryNames = ['Sombrerería', 'Cerámica', 'Tejeduría', 'Talla en madera', 'Orfebrería'];
  const categoriesMap: Record<string, Category> = {};
  for (const name of categoryNames) {
    let cat = await categoryRepo.findOneBy({ name });
    if (!cat) {
      cat = categoryRepo.create({ name, description: `Artesanía de ${name} del Huila` });
      await categoryRepo.save(cat);
    }
    categoriesMap[name] = cat;
  }

  // 4. Asegurar regiones en DB
  const regionNames = [
    'Acevedo', 'Agrado', 'Aipe', 'Algeciras', 'Altamira', 'Baraya', 'Campoalegre', 'Colombia', 'Elías', 'Garzón',
    'Gigante', 'Guadalupe', 'Hobo', 'Íquira', 'Isnos', 'La Argentina', 'La Plata', 'Nátaga', 'Neiva', 'Oporapa',
    'Paicol', 'Palermo', 'Palestina', 'Pital', 'Pitalito', 'Rivera', 'Saladoblanco', 'San Agustín', 'Santa María', 'Suaza',
    'Tarqui', 'Tello', 'Teruel', 'Tesalia', 'Timaná', 'Villavieja', 'Yaguará'
  ];
  const regionsMap: Record<string, Region> = {};
  for (const name of regionNames) {
    let reg = await regionRepo.findOneBy({ name });
    if (!reg) {
      reg = regionRepo.create({ name, description: `Municipio de ${name}, Huila` });
      await regionRepo.save(reg);
    }
    regionsMap[name] = reg;
  }

  // 5. Asegurar un artesano verificado
  let artisanUser = await userRepo.findOneBy({ email: 'rosa@artesano.com' });
  if (!artisanUser) {
    artisanUser = userRepo.create({
      full_name: 'Rosa Elena Vargas',
      email: 'rosa@artesano.com',
      password_hash: await bcrypt.hash('Artesano123!', 10),
      role: UserRole.ARTISAN,
    });
    await userRepo.save(artisanUser);
  }

  let defaultArtisan = await artisanRepo.findOne({ where: { user: { id: artisanUser.id } }, relations: ['user', 'region'] });
  if (!defaultArtisan) {
    defaultArtisan = artisanRepo.create({
      user: artisanUser,
      id_number: '10234567',
      cultural_history: 'Rosa Elena es una artesana de amplia trayectoria, tejedora de sombreros tradicionales y mochilas en el Huila.',
      category: categoriesMap['Sombrerería'],
      region: regionsMap['Suaza'],
      verification_status: ArtisanStatus.VERIFIED,
      truthfulness_declaration: true,
    });
    await artisanRepo.save(defaultArtisan);
  }

  // 6. Importar productos
  let count = 0;
  const categoryCounters: Record<string, number> = {};

  for (const row of productsList) {
    const rawName = row['Nombre del Producto'] || '';
    if (!rawName.trim()) continue;

    const rawSlug = row['Enlace del Producto (Slug)'] || '';
    const slug = rawSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
                 rawName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Verificar si ya existe un producto con el mismo slug para evitar duplicados
    let product = await productRepo.findOneBy({ slug });
    if (!product) {
      const catName = (row['Categoría'] || '').trim();
      const category = categoriesMap[catName] || categoriesMap['Tejeduría'];

      const regName = (row['Región'] || '').trim();
      const region = regionsMap[regName] || defaultArtisan.region;

      const price = parseFloat(row['Precio']) || 0;
      const stock = parseInt(row['Cantidad en Inventario']) || 0;
      const isHandmade = row['Hecho a Mano (Sí/No)'] === 'Sí' || row['Hecho a Mano (Sí/No)'] === 'true' || row['Hecho a Mano (Sí/No)'] === true;
      const status = row['Estado (borrador/publicado)'] === 'publicado' ? ProductStatus.PUBLISHED : ProductStatus.DRAFT;

      product = productRepo.create({
        name: rawName.trim(),
        slug,
        price,
        stock,
        artisan: defaultArtisan,
        category,
        region,
        cultural_origin: row['Origen Cultural (Pueblo/Comunidad)'] || 'Comunidad artesana de Neiva, Huila',
        technique: row['Técnica Artesanal'] || 'Tejido manual tradicional',
        significance: row['Significado Cultural'] || 'Pieza tradicional con valor histórico y cultural',
        short_description: row['Descripción Corta'] || '',
        materials: row['Materiales'] || '',
        dimensions: row['Dimensiones'] || '',
        weight: row['Peso'] || '',
        care_instructions: row['Instrucciones de Cuidado'] || '',
        is_handmade: isHandmade,
        status: status,
        meta_title: row['Título SEO (Opcional)'] || `${rawName.trim()} | Art Huila`,
        meta_description: row['Descripción SEO (Opcional)'] || `Descubre ${rawName.trim()}, una pieza artesanal auténtica del Huila, Colombia.`,
      });

      await productRepo.save(product);

      // Asignar imagen hermosa y giratoria según su categoría
      const imgs = categoryImages[category.name] || categoryImages['Tejeduría'];
      if (!categoryCounters[category.name]) {
        categoryCounters[category.name] = 0;
      }
      const imgIndex = categoryCounters[category.name] % imgs.length;
      categoryCounters[category.name]++;

      const imageUrl = imgs[imgIndex];

      const img = imageRepo.create({
        url: imageUrl,
        public_id: `unsplash_placeholder_${slug}`,
        product,
      });
      await imageRepo.save(img);

      count++;
    }
  }

  await dataSource.destroy();
  console.log(`\n🎉 ¡Recuperación exitosa! Se han importado e ilustrado ${count} productos de tu Excel original de forma impecable.`);
};

recoverDatabase().catch(err => {
  console.error('❌ Error en el script de recuperación:', err.message);
});
