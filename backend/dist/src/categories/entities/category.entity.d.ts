import { Product } from '../../products/entities/product.entity';
export declare class Category {
    id: string;
    name: string;
    description: string;
    products: Product[];
    created_at: Date;
    updated_at: Date;
}
