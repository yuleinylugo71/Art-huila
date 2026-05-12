import { ArtisanProfile } from '../../artisans/entities/artisan-profile.entity';
import { Category } from '../../categories/entities/category.entity';
import { Region } from '../../regions/entities/region.entity';
import { ProductImage } from './product-image.entity';
export declare enum ProductStatus {
    DRAFT = "draft",
    PUBLISHED = "published"
}
export declare class Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
    artisan: ArtisanProfile;
    category: Category;
    region: Region;
    cultural_origin: string;
    technique: string;
    significance: string;
    status: ProductStatus;
    meta_title: string;
    meta_description: string;
    images: ProductImage[];
    created_at: Date;
    updated_at: Date;
}
