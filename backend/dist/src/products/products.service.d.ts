import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ArtisansService } from '../artisans/artisans.service';
export declare class ProductsService {
    private readonly productRepo;
    private readonly imageRepo;
    private readonly artisansService;
    constructor(productRepo: Repository<Product>, imageRepo: Repository<ProductImage>, artisansService: ArtisansService);
    create(userId: string, data: any): Promise<Product[]>;
    findBySlug(slug: string): Promise<Product>;
    update(productId: string, userId: string, data: any): Promise<Product | null>;
    findByArtisan(userId: string): Promise<Product[]>;
    addImages(productId: string, userId: string, images: {
        url: string;
        publicId: string;
    }[]): Promise<ProductImage[]>;
    findAll(): Promise<Product[]>;
    hide(id: string): Promise<Product | null>;
    remove(id: string): Promise<void>;
    findFiltered(query?: string, featured?: boolean, limit?: number): Promise<Product[]>;
    getCount(): Promise<number>;
}
