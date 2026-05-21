import { Repository, DataSource } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { MailService } from '../mail/mail.service';
import { MipaqueteService } from '../logistics/mipaquete/mipaquete.service';
export declare class OrdersService {
    private readonly ordersRepository;
    private readonly orderItemsRepository;
    private readonly productsRepository;
    private readonly mailService;
    private readonly mipaqueteService;
    private dataSource;
    constructor(ordersRepository: Repository<Order>, orderItemsRepository: Repository<OrderItem>, productsRepository: Repository<Product>, mailService: MailService, mipaqueteService: MipaqueteService, dataSource: DataSource);
    create(createOrderDto: CreateOrderDto, user: User): Promise<Order | null>;
    findAll(): Promise<Order[]>;
    getShippingQuoteForCart(destinationCity: string, items: {
        productId: string;
        quantity: number;
    }[]): Promise<{
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
    findByUser(userId: string): Promise<Order[]>;
    findOne(id: string, user: User): Promise<Order | null>;
    processPayment(id: string, user: User): Promise<Order>;
    markAsPaid(orderId: string, paymentId: string): Promise<Order>;
    updateStatus(id: string, status: OrderStatus, user?: any): Promise<Order>;
    updateTracking(id: string, trackingNumber: string, shippingCompany: string): Promise<Order>;
    findArtisanSales(userId: string): Promise<OrderItem[]>;
}
