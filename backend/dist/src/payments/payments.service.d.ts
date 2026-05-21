import { ConfigService } from '@nestjs/config';
import { Order } from '../orders/entities/order.entity';
import { OrdersService } from '../orders/orders.service';
export declare class PaymentsService {
    private configService;
    private ordersService;
    constructor(configService: ConfigService, ordersService: OrdersService);
    createPreference(order: Order): Promise<{
        status: string;
    }>;
    handleWebhook(data: any): Promise<void>;
}
