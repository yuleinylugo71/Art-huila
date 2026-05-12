import { Repository, DataSource } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
export declare class OrdersService {
    private readonly ordersRepository;
    private readonly orderItemsRepository;
    private readonly productsRepository;
    private dataSource;
    constructor(ordersRepository: Repository<Order>, orderItemsRepository: Repository<OrderItem>, productsRepository: Repository<Product>, dataSource: DataSource);
    create(createOrderDto: CreateOrderDto, user: User): Promise<Order | null>;
    findAll(user: User): Promise<Order[]>;
    findOne(id: string, user: User): Promise<Order | null>;
    processPayment(id: string, user: User): Promise<Order>;
}
