import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ArtisanProfile } from '../artisans/entities/artisan-profile.entity';
import { ArtisansModule } from '../artisans/artisans.module';
import { MailModule } from '../mail/mail.module';
import { AuditModule } from '../audit/audit.module';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { ArtisanAuditLog } from '../artisans/entities/artisan-audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ArtisanProfile, ArtisanAuditLog]),
    ArtisansModule,
    MailModule,
    AuditModule,
    UsersModule,
    OrdersModule,
    ProductsModule,
    ReviewsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
