import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';
export declare enum OrderStatus {
    PENDING = "pending",
    PAID = "paid",
    PREPARING = "preparing",
    SHIPPED = "shipped",
    DELIVERED = "delivered",
    CANCELLED = "cancelled",
    REFUNDED = "refunded",
    NOVELTY = "novelty"
}
export declare class Order {
    id: string;
    user: User;
    total_amount: number;
    status: OrderStatus;
    shipping_cost: number;
    estimated_delivery_days: number;
    shipping_address: any;
    payment_method: string;
    payment_id: string;
    tracking_number: string;
    shipping_company: string;
    items: OrderItem[];
    created_at: Date;
    updated_at: Date;
}
