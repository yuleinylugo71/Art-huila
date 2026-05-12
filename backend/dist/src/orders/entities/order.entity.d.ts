import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';
export declare enum OrderStatus {
    PENDING = "pending",
    PAID = "paid",
    SHIPPED = "shipped",
    DELIVERED = "delivered",
    CANCELLED = "cancelled"
}
export declare class Order {
    id: string;
    user: User;
    total_amount: number;
    status: OrderStatus;
    shipping_address: any;
    payment_method: string;
    payment_id: string;
    items: OrderItem[];
    created_at: Date;
    updated_at: Date;
}
