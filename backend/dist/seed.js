"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const path = __importStar(require("path"));
const user_entity_1 = require("./src/users/entities/user.entity");
const category_entity_1 = require("./src/categories/entities/category.entity");
const region_entity_1 = require("./src/regions/entities/region.entity");
const artisan_profile_entity_1 = require("./src/artisans/entities/artisan-profile.entity");
const artisan_gallery_entity_1 = require("./src/artisans/entities/artisan-gallery.entity");
const product_entity_1 = require("./src/products/entities/product.entity");
const product_image_entity_1 = require("./src/products/entities/product-image.entity");
const admin_audit_log_entity_1 = require("./src/audit/entities/admin-audit-log.entity");
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const seedDatabase = async () => {
    const dataSource = new typeorm_1.DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL || 'postgresql://postgres:0408@localhost:5432/arthuila',
        entities: [user_entity_1.User, category_entity_1.Category, region_entity_1.Region, artisan_profile_entity_1.ArtisanProfile, artisan_gallery_entity_1.ArtisanGallery, product_entity_1.Product, product_image_entity_1.ProductImage, admin_audit_log_entity_1.AdminAuditLog],
        synchronize: true,
    });
    await dataSource.initialize();
    console.log('✅ Database connected for seeding...');
    const categoryRepo = dataSource.getRepository(category_entity_1.Category);
    const categoryNames = ['Tejeduría', 'Cerámica', 'Talla en madera', 'Orfebrería', 'Sombrerería'];
    const categories = [];
    for (const name of categoryNames) {
        let cat = await categoryRepo.findOneBy({ name });
        if (!cat) {
            cat = categoryRepo.create({ name, description: `Artesanía de ${name} del Huila` });
            await categoryRepo.save(cat);
        }
        categories.push(cat);
    }
    console.log('✅ Categories seeded.');
    const regionRepo = dataSource.getRepository(region_entity_1.Region);
    const regionNames = ['Neiva', 'Pitalito', 'Garzón', 'La Plata', 'Campoalegre', 'Rivera', 'Agrado', 'Isnos'];
    const regions = [];
    for (const name of regionNames) {
        let reg = await regionRepo.findOneBy({ name });
        if (!reg) {
            reg = regionRepo.create({ name, description: `Municipio de ${name}, Huila` });
            await regionRepo.save(reg);
        }
        regions.push(reg);
    }
    console.log('✅ Regions seeded.');
    const userRepo = dataSource.getRepository(user_entity_1.User);
    let admin = await userRepo.findOneBy({ email: 'admin@arthuila.com' });
    if (!admin) {
        admin = userRepo.create({
            full_name: 'Administrador Art Huila',
            email: 'admin@arthuila.com',
            password_hash: await bcrypt.hash('Admin1234!', 10),
            role: user_entity_1.UserRole.ADMIN,
        });
        await userRepo.save(admin);
        console.log('✅ Admin user seeded: admin@arthuila.com / Admin1234!');
    }
    const artisanRepo = dataSource.getRepository(artisan_profile_entity_1.ArtisanProfile);
    const artisansData = [
        { name: 'Rosa Elena Vargas', email: 'rosa@artesano.com', status: artisan_profile_entity_1.VerificationStatus.VERIFIED, idNum: '10234567', cat: 0, reg: 0 },
        { name: 'Carlos Murcia', email: 'carlos@artesano.com', status: artisan_profile_entity_1.VerificationStatus.PENDING, idNum: '20345678', cat: 1, reg: 1 },
    ];
    const artisanProfiles = [];
    for (const aData of artisansData) {
        let user = await userRepo.findOneBy({ email: aData.email });
        if (!user) {
            user = userRepo.create({
                full_name: aData.name,
                email: aData.email,
                password_hash: await bcrypt.hash('Artesano123!', 10),
                role: user_entity_1.UserRole.ARTISAN,
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
    const productRepo = dataSource.getRepository(product_entity_1.Product);
    const imageRepo = dataSource.getRepository(product_image_entity_1.ProductImage);
    const verifiedArtisan = artisanProfiles.find(p => p.verification_status === artisan_profile_entity_1.VerificationStatus.VERIFIED);
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
                    status: product_entity_1.ProductStatus.PUBLISHED,
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
//# sourceMappingURL=seed.js.map