import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(createOrderDto: CreateOrderDto, user: any): Promise<import("./entities/order.entity").Order | null>;
    findAll(user: any): Promise<import("./entities/order.entity").Order[]>;
    findOne(id: string, user: any): Promise<import("./entities/order.entity").Order | null>;
    processPayment(id: string, user: any): Promise<import("./entities/order.entity").Order>;
}
