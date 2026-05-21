import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Product } from '../products/entities/product.entity';
import { OrdersService } from '../orders/orders.service';
import { MailService } from '../mail/mail.service';
export declare class ReviewsService {
    private readonly reviewRepo;
    private readonly productRepo;
    private readonly ordersService;
    private readonly mailService;
    constructor(reviewRepo: Repository<Review>, productRepo: Repository<Product>, ordersService: OrdersService, mailService: MailService);
    create(userId: string, data: {
        productId: string;
        rating: number;
        comment: string;
    }): Promise<Review>;
    findByProduct(productId: string): Promise<Review[]>;
    findAll(): Promise<Review[]>;
    findReported(): Promise<Review[]>;
    report(id: string, reason: string): Promise<Review>;
    resetReport(id: string): Promise<Review>;
    findOne(id: string): Promise<Review | null>;
    remove(id: string): Promise<void>;
    respond(id: string, userId: string, response: string): Promise<Review>;
}
