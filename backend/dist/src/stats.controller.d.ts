import { ProductsService } from './products/products.service';
import { ArtisansService } from './artisans/artisans.service';
export declare class StatsController {
    private readonly productsService;
    private readonly artisansService;
    constructor(productsService: ProductsService, artisansService: ArtisansService);
    getStats(): Promise<{
        artisans_count: number;
        products_count: number;
        avg_rating: number;
        delivery_days: string;
    }>;
}
