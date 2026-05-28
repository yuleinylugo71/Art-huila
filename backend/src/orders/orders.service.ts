import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { MailService } from '../mail/mail.service';
import { MipaqueteService } from '../logistics/mipaquete/mipaquete.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    private readonly mailService: MailService,
    private readonly mipaqueteService: MipaqueteService,
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
      let originCity = 'Neiva'; // Default

      for (const itemDto of createOrderDto.items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: itemDto.productId },
          relations: ['artisan', 'artisan.region']
        });

        if (!product) {
          throw new NotFoundException(`Product ${itemDto.productId} not found`);
        }

        if (product.stock < itemDto.quantity) {
          throw new BadRequestException(`Not enough stock for product: ${product.name}`);
        }

        // Note: As per requirements, all products are shipped from the central hub in Neiva.
        // We do not override originCity with the artisan's region.
        // if (orderItems.length === 0 && product.artisan && product.artisan.region) {
        //   originCity = product.artisan.region.name;
        // }

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

      // Calculate shipping cost via MiPaquete
      const quote = await this.mipaqueteService.getShippingQuote(
        originCity,
        createOrderDto.shipping_address.city || 'Bogotá',
        1 // Default weight
      );
      order.shipping_cost = quote.cost;
      order.estimated_delivery_days = quote.estimatedDays;
      order.shipping_company = quote.carrier;

      order.total_amount = totalAmount + Number(order.shipping_cost);
      order.items = orderItems;

      const savedOrder = await queryRunner.manager.save(Order, order);

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

  findAll() {
    return this.ordersRepository.find({
      relations: ['user', 'items', 'items.product', 'items.product.artisan', 'items.product.images'],
      order: { created_at: 'DESC' },
    });
  }

  async getShippingQuoteForCart(destinationCity: string, items: { productId: string; quantity: number }[]) {
    let originCity = 'Neiva'; // Default

    // Note: As per requirements, all products are shipped from the central hub in Neiva.
    // We do not override originCity with the artisan's region.
    // if (items && items.length > 0) {
    //   const firstItem = items[0];
    //   const product = await this.productsRepository.findOne({
    //     where: { id: firstItem.productId },
    //     relations: ['artisan', 'artisan.region']
    //   });
    //
    //   if (product && product.artisan && product.artisan.region) {
    //     originCity = product.artisan.region.name;
    //   }
    // }

    const quote = await this.mipaqueteService.getShippingQuote(originCity, destinationCity, 1);
    return {
      ...quote
    };
  }

  findByUser(userId: string) {
    return this.ordersRepository.find({
      where: { user: { id: userId } },
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
    
    // Manual/Mock payment processing...
    return this.markAsPaid(id, `MOCK_PAY_${Date.now()}`);
  }

  async markAsPaid(orderId: string, paymentId: string) {
    const order = await this.ordersRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    order.status = OrderStatus.PAID;
    order.payment_id = paymentId;
    
    const savedOrder = await this.ordersRepository.save(order);

    // Send emails
    try {
      const fullOrder = await this.ordersRepository.findOne({
        where: { id: orderId },
        relations: ['user', 'items', 'items.product', 'items.product.artisan', 'items.product.artisan.user']
      });

      if (fullOrder) {
        // Notify buyer
        await this.mailService.sendOrderConfirmationEmail(
          fullOrder.user.email,
          fullOrder.user.full_name,
          fullOrder.id,
          fullOrder.total_amount
        );

        // Notify each artisan
        for (const item of fullOrder.items) {
          const artisanUser = item.product.artisan?.user;
          if (artisanUser) {
            await this.mailService.sendSaleNotificationEmail(
              artisanUser.email,
              artisanUser.full_name,
              item.product.name,
              item.quantity
            );
          }
        }
      }
    } catch (error) {
      console.error('Error sending order notification emails:', error);
    }

    return savedOrder;
  }

  async updateStatus(id: string, status: OrderStatus, user?: any) {
    const order = await this.ordersRepository.findOne({ 
      where: { id },
      relations: ['items', 'items.product']
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (user) {
      const role = user.role;
      if (role === 'artesano') {
        if (order.status === OrderStatus.PAID && status === OrderStatus.PREPARING) {
          // OK
        } else if (order.status === OrderStatus.PREPARING && status === OrderStatus.SHIPPED) {
          // OK
        } else {
          throw new BadRequestException('El artesano solo puede cambiar el estado de Pagado a En preparación o de En preparación a Despachado.');
        }
      } else if (role === 'admin') {
        if (status === OrderStatus.CANCELLED || status === OrderStatus.DELIVERED) {
          // OK
        } else {
          throw new BadRequestException('El administrador solo puede marcar un pedido como Cancelado o Entregado.');
        }
      }
    }

    // If order is being cancelled, return stock
    if (status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
      for (const item of order.items) {
        const product = item.product;
        product.stock += item.quantity;
        await this.productsRepository.save(product);
      }
    }

    order.status = status;
    return this.ordersRepository.save(order);
  }

  async updateTracking(id: string, trackingNumber: string, shippingCompany: string) {
    const order = await this.ordersRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.tracking_number = trackingNumber;
    order.shipping_company = shippingCompany;
    order.status = OrderStatus.SHIPPED; // Auto-update to SHIPPED when tracking is added? Usually yes.
    
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
