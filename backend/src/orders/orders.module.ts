import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity'; // For stock validation
import { MailModule } from '../mail/mail.module';
import { LogisticsModule } from '../logistics/logistics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product]),
    MailModule,
    LogisticsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
