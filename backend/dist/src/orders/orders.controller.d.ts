import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(createOrderDto: CreateOrderDto, user: any): Promise<import("./entities/order.entity").Order | null>;
    getShippingQuote(body: {
        destinationCity: string;
        items: any[];
    }): Promise<{
        isFallback: boolean;
        originCity: string;
        cost: number;
        estimatedDays: number;
        carrier: string;
        fallbackMessage: null;
        options: {
            carrier: string;
            price: number;
            estimatedDays: number;
        }[];
    }>;
    findArtisanSales(user: any): Promise<import("./entities/order-item.entity").OrderItem[]>;
    findAll(user: any): Promise<import("./entities/order.entity").Order[]>;
    findOne(id: string, user: any): Promise<import("./entities/order.entity").Order | null>;
    processPayment(id: string, user: any): Promise<import("./entities/order.entity").Order>;
    updateStatus(id: string, status: any, user: any): Promise<import("./entities/order.entity").Order>;
    updateTracking(id: string, trackingNumber: string, shippingCompany: string): Promise<import("./entities/order.entity").Order>;
}
