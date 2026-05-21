import { PaymentsService } from './payments.service';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from '../orders/orders.service';
export declare class PaymentsController {
    private readonly paymentsService;
    private readonly ordersService;
    private readonly configService;
    constructor(paymentsService: PaymentsService, ordersService: OrdersService, configService: ConfigService);
    getEpaycoConfig(): Promise<{
        publicKey: string | undefined;
    }>;
    createPreference(orderId: string, user: any): Promise<{
        status: string;
    }>;
    handleWebhook(body: any, query: any): Promise<{
        status: string;
    }>;
}
