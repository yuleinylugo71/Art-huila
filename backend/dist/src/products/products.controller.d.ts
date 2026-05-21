import { ProductsService } from './products.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
export declare class ProductsController {
    private readonly productsService;
    private readonly cloudinaryService;
    constructor(productsService: ProductsService, cloudinaryService: CloudinaryService);
    findAll(query?: string, featured?: string, limit?: string): Promise<{
        id: string;
        name: string;
        slug: string;
        price: number;
        status: string;
        artisan: {
            name: string;
            avatar_url: string;
        };
        rating: number;
        review_count: number;
        image_url: string;
    }[]>;
    findOne(slug: string): Promise<import("./entities/product.entity").Product>;
    myProducts(user: any): Promise<import("./entities/product.entity").Product[]>;
    create(user: any, body: any): Promise<import("./entities/product.entity").Product[]>;
    update(id: string, user: any, body: any): Promise<import("./entities/product.entity").Product | null>;
    uploadImages(id: string, user: any, files: Express.Multer.File[]): Promise<import("./entities/product-image.entity").ProductImage[]>;
}
