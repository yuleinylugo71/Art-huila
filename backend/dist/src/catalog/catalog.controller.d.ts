import { CatalogService } from './catalog.service';
export declare class CatalogController {
    private readonly catalogService;
    constructor(catalogService: CatalogService);
    findAll(regions?: string, categories?: string, minPrice?: string, maxPrice?: string, sortBy?: string, page?: string, limit?: string, artisanId?: string): Promise<{
        data: import("../products/entities/product.entity").Product[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
}
