import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    private dataSource: DataSource,
  ) {}

  async create(createOrderDto: CreateOrderDto, user: User) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let totalAmount = 0;
      const orderItems: OrderItem[] = [];

      // Create main order first to get ID reference
      const order = new Order();
      order.user = user;
      order.shipping_address = createOrderDto.shipping_address;
      order.payment_method = createOrderDto.payment_method;
      order.status = OrderStatus.PENDING;

      // Process items
      for (const itemDto of createOrderDto.items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: itemDto.productId },
        });

        if (!product) {
          throw new NotFoundException(`Product ${itemDto.productId} not found`);
        }

        if (product.stock < itemDto.quantity) {
          throw new BadRequestException(`Not enough stock for product: ${product.name}`);
        }

        // Subtract stock
        product.stock -= itemDto.quantity;
        await queryRunner.manager.save(product);

        const subtotal = product.price * itemDto.quantity;
        totalAmount += subtotal;

        const orderItem = new OrderItem();
        orderItem.product = product;
        orderItem.quantity = itemDto.quantity;
        orderItem.unit_price = product.price;
        orderItem.subtotal = subtotal;

        orderItems.push(orderItem);
      }

      order.total_amount = totalAmount;
      const savedOrder = await queryRunner.manager.save(Order, order);

      for (const item of orderItems) {
        item.order = savedOrder;
        await queryRunner.manager.save(OrderItem, item);
      }

      await queryRunner.commitTransaction();

      // Return fully loaded order
      return this.ordersRepository.findOne({
        where: { id: savedOrder.id },
        relations: ['items', 'items.product', 'items.product.artisan'],
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  findAll(user: User) {
    return this.ordersRepository.find({
      where: { user: { id: user.id } },
      relations: ['items', 'items.product', 'items.product.artisan', 'items.product.images'],
      order: { created_at: 'DESC' },
    });
  }

  findOne(id: string, user: User) {
    return this.ordersRepository.findOne({
      where: { id, user: { id: user.id } },
      relations: ['items', 'items.product', 'items.product.artisan', 'items.product.images'],
    });
  }

  async processPayment(id: string, user: User) {
    const order = await this.findOne(id, user);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    
    // Simulate payment processing...
    order.status = OrderStatus.PAID;
    order.payment_id = `MOCK_PAY_${Date.now()}`;
    
    return this.ordersRepository.save(order);
  }

  async findArtisanSales(userId: string) {
    return this.orderItemsRepository.find({
      where: { product: { artisan: { user: { id: userId } } } },
      relations: ['order', 'order.user', 'product', 'product.images'],
      order: { order: { created_at: 'DESC' } },
    });
  }
}
