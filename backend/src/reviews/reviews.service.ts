import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Product } from '../products/entities/product.entity';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../orders/entities/order.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly ordersService: OrdersService,
    private readonly mailService: MailService,
  ) {}

  async create(userId: string, data: { productId: string; rating: number; comment: string }) {
    const product = await this.productRepo.findOneBy({ id: data.productId });
    if (!product) throw new NotFoundException('Producto no encontrado');

    // Check if user bought the product and it was delivered
    const orders = await this.ordersService.findByUser(userId);
    const deliveredOrders = orders.filter(o => o.status === OrderStatus.DELIVERED);
    const hasBought = deliveredOrders.some(o => 
      o.items.some(i => i.product.id === data.productId)
    );

    if (!hasBought) {
      const orderCount = orders.length;
      const deliveredCount = deliveredOrders.length;
      throw new BadRequestException(
        `No se pudo verificar la compra. Pedidos totales: ${orderCount}, Entregados: ${deliveredCount}. ` +
        `Para calificar, el pedido debe estar en estado 'delivered'.`
      );
    }

    const review = this.reviewRepo.create({
      rating: data.rating,
      comment: data.comment,
      product,
      user: { id: userId } as any,
    });
    return this.reviewRepo.save(review);
  }

  async findByProduct(productId: string) {
    return this.reviewRepo.find({
      where: { product: { id: productId } },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async findAll() {
    return this.reviewRepo.find({
      relations: ['user', 'product'],
      order: { created_at: 'DESC' },
    });
  }

  async findReported() {
    return this.reviewRepo.find({
      where: { is_reported: true },
      relations: ['user', 'product'],
      order: { created_at: 'DESC' },
    });
  }

  async report(id: string, reason: string) {
    const review = await this.reviewRepo.findOneBy({ id });
    if (!review) throw new NotFoundException('Reseña no encontrada');
    review.is_reported = true;
    review.report_reason = reason;
    return this.reviewRepo.save(review);
  }

  async resetReport(id: string) {
    const review = await this.reviewRepo.findOneBy({ id });
    if (!review) throw new NotFoundException('Reseña no encontrada');
    review.is_reported = false;
    review.report_reason = null;
    return this.reviewRepo.save(review);
  }

  async findOne(id: string) {
    return this.reviewRepo.findOne({ where: { id }, relations: ['user', 'product'] });
  }

  async remove(id: string) {
    const review = await this.reviewRepo.findOneBy({ id });
    if (!review) throw new NotFoundException('Reseña no encontrada');
    await this.reviewRepo.remove(review);
  }

  async respond(id: string, userId: string, response: string) {
    const review = await this.reviewRepo.findOne({
      where: { id },
      relations: ['user', 'product', 'product.artisan', 'product.artisan.user'],
    });
    if (!review) throw new NotFoundException('Reseña no encontrada');
    if (review.product.artisan.user.id !== userId) {
      throw new ForbiddenException('Solo el artesano que vendió el producto puede responder');
    }
    if (review.artisan_response) {
      throw new BadRequestException('Ya has respondido a esta reseña');
    }
    review.artisan_response = response;
    review.responded_at = new Date();
    const saved = await this.reviewRepo.save(review);

    // Notify buyer
    try {
      await this.mailService.sendArtisanResponseEmail(
        review.user.email,
        review.user.full_name,
        review.product.artisan.user.full_name,
        review.product.name
      );
    } catch (e) { console.error('Error sending review response email:', e); }

    return saved;
  }
}
