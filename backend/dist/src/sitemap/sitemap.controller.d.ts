import { ProductsService } from '../products/products.service';
import { ConfigService } from '@nestjs/config';
export declare class SitemapController {
    private readonly productsService;
    private readonly configService;
    constructor(productsService: ProductsService, configService: ConfigService);
    getSitemap(): Promise<string>;
}
