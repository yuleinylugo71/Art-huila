import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
export declare class CatalogService {
    private readonly productRepo;
    constructor(productRepo: Repository<Product>);
    findAll(params: {
        regions?: string[];
        categories?: string[];
        materials?: string[];
        minPrice?: number;
        maxPrice?: number;
        sortBy?: string;
        page?: number;
        limit?: number;
        artisanId?: string;
        search?: string;
    }): Promise<{
        data: Product[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
}
