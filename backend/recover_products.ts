import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import * as XLSX from 'xlsx';
import * as dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { User } from './src/users/entities/user.entity';
import { Category } from './src/categories/entities/category.entity';
import { Region } from './src/regions/entities/region.entity';
import { ArtisanProfile, ArtisanStatus } from './src/artisans/entities/artisan-profile.entity';
import { ArtisanGallery } from './src/artisans/entities/artisan-gallery.entity';
import { Product, ProductStatus } from './src/products/entities/product.entity';
import { ProductImage } from './src/products/entities/product-image.entity';
import { AdminAuditLog } from './src/audit/entities/admin-audit-log.entity';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configurar Cloudinary usando las credenciales del archivo .env de forma directa
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const excelPath = 'C:\\Users\\Yuleiny\\Downloads\\Plantilla_Productos_ArtHuila_50.xlsx';
const downloadsDir = 'C:\\Users\\Yuleiny\\Downloads';

// Función inteligente de mapeo de nombres de productos a sus respectivas imágenes reales descargadas
function getMatchingImageFile(productName: string): string {
  const lowerName = productName.toLowerCase().trim();
  
  if (lowerName.includes('máscara') || lowerName.includes('mascara')) {
    return 'descarga (1).jpg';
  }
  if (lowerName.includes('caimán') || lowerName.includes('caiman')) {
    return 'descarga (13).jpg';
  }
  if (lowerName.includes('jaguar')) {
    return 'descarga (19).jpg';
  }
  if (lowerName.includes('bastón') || lowerName.includes('baston')) {
    return 'descarga (31).jpg';
  }
  if (lowerName.includes('suazero') || lowerName.includes('vueltiao') || lowerName.includes('aguadeño') || lowerName.includes('sombrero')) {
    if (lowerName.includes('palma') || lowerName.includes('aguadeño') || lowerName.includes('tello')) {
      return 'descarga (2).jpg'; // Sombrero de palma / Tello / Aguadeño
    }
    return 'descarga (7).jpg'; // Sombrero suazero / paja / vueltiao
  }
  if (lowerName.includes('mochila') || lowerName.includes('bolso') || lowerName.includes('cabuya') || lowerName.includes('fique') || lowerName.includes('cesta') || lowerName.includes('canasto')) {
    if (lowerName.includes('fique') || lowerName.includes('cabuya') || lowerName.includes('mochila')) {
      if (lowerName.includes('san agustín') || lowerName.includes('san agustin')) {
        return 'descarga (32).jpg'; // Mochila wayuu/fique azul/violeta
      }
      return 'descarga (28).jpg'; // Bolso fique blanco
    }
    if (lowerName.includes('canasto') || lowerName.includes('cesta')) {
      return 'descarga (11).jpg'; // Canasto de mimbre marrón
    }
    return 'descarga (10).jpg'; // Bolso de palma
  }
  if (lowerName.includes('aretes') || lowerName.includes('pendientes') || lowerName.includes('broche') || lowerName.includes('pulsera') || lowerName.includes('manilla') || lowerName.includes('anillo')) {
    if (lowerName.includes('cobre') || lowerName.includes('aretes de tagua') || lowerName.includes('pendientes')) {
      return 'descarga (30).jpg'; // Pendientes de cobre / filigrana
    }
    if (lowerName.includes('cerámica') || lowerName.includes('ceramica') || lowerName.includes('aretes de cerámica')) {
      return 'descarga (25).jpg'; // Aretes turquesa cerámica
    }
    if (lowerName.includes('broche')) {
      return 'descarga (22).jpg'; // Broche mariposa tagua
    }
    if (lowerName.includes('cinturón') || lowerName.includes('cinturon')) {
      return 'descarga (15).jpg'; // Cinturón cuero
    }
    return 'descarga (21).jpg'; // Manilla/pulsera cuero
  }
  if (lowerName.includes('collar')) {
    if (lowerName.includes('chaquiras') || lowerName.includes('páez') || lowerName.includes('paez')) {
      return 'descarga (14).jpg'; // Collar de chaquiras
    }
    if (lowerName.includes('huesos') || lowerName.includes('semillas')) {
      return 'descarga (3).jpg'; // Collar de semillas / huesos
    }
    return 'descarga (27).jpg'; // Collar decorativo
  }
  if (lowerName.includes('vasija') || lowerName.includes('barro') || lowerName.includes('cerámica') || lowerName.includes('ceramica') || lowerName.includes('plato') || lowerName.includes('jarro') || lowerName.includes('taza') || lowerName.includes('jarrón') || lowerName.includes('florero') || lowerName.includes('macetero')) {
    if (lowerName.includes('vasija') || lowerName.includes('figura')) {
      return 'descarga (29).jpg'; // Figuras pequeñas arcilla / vasija
    }
    if (lowerName.includes('jarrón') || lowerName.includes('jarron') || lowerName.includes('barro') || lowerName.includes('cerámica san agustín')) {
      return 'descarga (26).jpg'; // Jarrón de barro grande
    }
    if (lowerName.includes('plato')) {
      return 'descarga (17).jpg'; // Plato decorativo azul
    }
    if (lowerName.includes('taza') || lowerName.includes('macetero')) {
      return 'descarga (8).jpg'; // Ollas / tazas de barro
    }
    if (lowerName.includes('jarro')) {
      return 'descarga (6).jpg'; // Jarro arcilla
    }
    return 'descarga.jpg'; // Taza de barro marrón
  }
  if (lowerName.includes('poncho') || lowerName.includes('ruana')) {
    return 'descarga (23).jpg'; // Poncho de lana
  }
  if (lowerName.includes('chal')) {
    return 'descarga (18).jpg'; // Chal tejido
  }
  if (lowerName.includes('mantel')) {
    return 'descarga (12).jpg'; // Mantel bordado
  }
  if (lowerName.includes('hamaca')) {
    return 'descarga (5).jpg'; // Hamaca algodón
  }
  if (lowerName.includes('tapete')) {
    return 'descarga (9).jpg'; // Tapete fique
  }
  if (lowerName.includes('cuadro')) {
    if (lowerName.includes('pirograbado')) {
      return 'descarga (16).jpg'; // Cuadro pirograbado madera
    }
    return 'descarga (20).jpg'; // Cuadro espejo marco cabuya
  }
  
  return 'descarga.jpg';
}

const recoverDatabase = async () => {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgresql://postgres:0408@localhost:5432/arthuila',
    entities: [User, Category, Region, ArtisanProfile, ArtisanGallery, Product, ProductImage, AdminAuditLog],
    synchronize: false, // ¡Totalmente deshabilitado aquí también para evitar borrado accidental!
  });

  await dataSource.initialize();
  console.log('✅ Conectado a la base de datos de manera segura...');

  // 1. Encontrar la artesana Deicy Quimbayo (yuleinylugo71@gmail.com)
  const artisanRepo = dataSource.getRepository(ArtisanProfile);
  const targetEmail = 'yuleinylugo71@gmail.com';
  
  const deicyArtisan = await artisanRepo.findOne({
    where: { user: { email: targetEmail } },
    relations: ['user', 'region'],
  });

  if (!deicyArtisan) {
    console.error(`❌ Error: No se encontró el perfil de la artesana con el correo ${targetEmail} en la base de datos.`);
    await dataSource.destroy();
    return;
  }
  console.log(`👤 Asociando todos los productos a la artesana: ${deicyArtisan.user.full_name} (${deicyArtisan.user.email})`);

  // 2. Escanear y subir las imágenes locales de Descargas a Cloudinary
  console.log('📂 Escaneando imágenes reales en la carpeta de Descargas...');
  const files = fs.readdirSync(downloadsDir);
  const descargaFiles = files.filter(f => f.toLowerCase().startsWith('descarga'));

  if (descargaFiles.length === 0) {
    console.error('❌ Error: No se encontraron las imágenes descargadas (descarga*.jpg) en la carpeta C:\\Users\\Yuleiny\\Downloads.');
    await dataSource.destroy();
    return;
  }

  console.log(`📸 Encontradas ${descargaFiles.length} imágenes para subir a Cloudinary...`);
  
  const cloudinaryUrlsMap = new Map<string, { secure_url: string; public_id: string }>();

  for (const fileName of descargaFiles) {
    const filePath = path.join(downloadsDir, fileName);
    console.log(`☁️ Subiendo ${fileName} a tu cuenta de Cloudinary...`);
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'arthuila/products',
        resource_type: 'image',
      });
      cloudinaryUrlsMap.set(fileName.toLowerCase(), {
        secure_url: result.secure_url,
        public_id: result.public_id,
      });
      console.log(`   ✅ ¡Subido con éxito! URL: ${result.secure_url}`);
    } catch (uploadErr: any) {
      console.error(`   ❌ Error subiendo ${fileName}:`, uploadErr.message);
    }
  }

  // 3. Limpiar imágenes y productos antiguos de forma segura para evitar FK crashes antes de re-importar
  const imageTableName = dataSource.getRepository(ProductImage).metadata.tableName;
  const productTableName = dataSource.getRepository(Product).metadata.tableName;
  await dataSource.query(`DELETE FROM "${imageTableName}"`);
  await dataSource.query(`DELETE FROM "${productTableName}"`);
  console.log('🧹 Base de datos local limpiada para evitar duplicaciones.');

  // 4. Cargar el archivo Excel
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const productsList = XLSX.utils.sheet_to_json(sheet) as any[];

  console.log(`📊 Encontrados ${productsList.length} productos en el archivo Excel.`);

  const productRepo = dataSource.getRepository(Product);
  const imageRepo = dataSource.getRepository(ProductImage);
  const categoryRepo = dataSource.getRepository(Category);
  const regionRepo = dataSource.getRepository(Region);

  // Asegurar categorías en DB
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

  // Asegurar regiones en DB
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

  // 5. Importar y enlazar productos con sus imágenes verdaderas en Cloudinary
  let count = 0;
  for (const row of productsList) {
    const rawName = row['Nombre del Producto'] || '';
    if (!rawName.trim()) continue;

    const rawSlug = row['Enlace del Producto (Slug)'] || '';
    const slug = rawSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
                 rawName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Verificar duplicación de slug
    let product = await productRepo.findOneBy({ slug });
    if (!product) {
      const catName = (row['Categoría'] || '').trim();
      const category = categoriesMap[catName] || categoriesMap['Tejeduría'];

      const regName = (row['Región'] || '').trim();
      const region = regionsMap[regName] || deicyArtisan.region;

      const price = parseFloat(row['Precio']) || 0;
      const stock = parseInt(row['Cantidad en Inventario']) || 0;
      const isHandmade = row['Hecho a Mano (Sí/No)'] === 'Sí' || row['Hecho a Mano (Sí/No)'] === 'true' || row['Hecho a Mano (Sí/No)'] === true;
      const status = row['Estado (borrador/publicado)'] === 'publicado' ? ProductStatus.PUBLISHED : ProductStatus.DRAFT;

      product = productRepo.create({
        name: rawName.trim(),
        slug,
        price,
        stock,
        artisan: deicyArtisan, // Registrado a nombre de Deicy Quimbayo
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

      // Encontrar la imagen verdadera para este producto
      const targetFileName = getMatchingImageFile(rawName);
      const cloudinaryImage = cloudinaryUrlsMap.get(targetFileName.toLowerCase());

      let finalUrl = 'https://res.cloudinary.com/dcoj4c3ay/image/upload/v1/arthuila/sample';
      let finalPublicId = `arthuila/sample_${slug}`;

      if (cloudinaryImage) {
        finalUrl = cloudinaryImage.secure_url;
        finalPublicId = cloudinaryImage.public_id;
        console.log(`🔗 Enlazado: "${rawName}" ➔ "${targetFileName}"`);
      } else {
        console.warn(`⚠️ Advertencia: No se encontró imagen cargada para "${targetFileName}". Se usará fallback.`);
      }

      const img = imageRepo.create({
        url: finalUrl,
        public_id: finalPublicId,
        product,
      });
      await imageRepo.save(img);

      count++;
    }
  }

  await dataSource.destroy();
  console.log(`\n🎉 ¡Recuperación exitosa! Se han importado ${count} productos en la cuenta de Deicy Quimbayo, enlazados perfectamente a las imágenes reales subidas a tu Cloudinary.`);
};

recoverDatabase().catch(err => {
  console.error('❌ Error en el script de recuperación:', err.message);
});
