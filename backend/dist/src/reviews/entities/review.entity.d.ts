import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';
export declare class Review {
    id: string;
    rating: number;
    comment: string;
    product: Product;
    user: User;
    is_reported: boolean;
    report_reason: string | null;
    artisan_response: string | null;
    responded_at: Date | null;
    created_at: Date;
}
