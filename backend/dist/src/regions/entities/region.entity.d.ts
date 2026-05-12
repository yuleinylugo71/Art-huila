import { Product } from '../../products/entities/product.entity';
import { ArtisanProfile } from '../../artisans/entities/artisan-profile.entity';
export declare class Region {
    id: string;
    name: string;
    description: string;
    artisans: ArtisanProfile[];
    products: Product[];
    created_at: Date;
    updated_at: Date;
}
