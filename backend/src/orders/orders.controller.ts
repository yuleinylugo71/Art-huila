import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @CurrentUser() user: any) {
    console.log('Order creation request from user:', user.id);
    return this.ordersService.create(createOrderDto, user);
  }

  @Post('shipping-quote')
  async getShippingQuote(@Body() body: { destinationCity: string; items: any[] }) {
    return this.ordersService.getShippingQuoteForCart(body.destinationCity, body.items);
  }

  @Get('artisan/sales')
  findArtisanSales(@CurrentUser() user: any) {
    return this.ordersService.findArtisanSales(user.id);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.ordersService.findByUser(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.findOne(id, user);
  }

  @Post(':id/pay')
  processPayment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.processPayment(id, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('artesano', 'admin')
  @Post(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: any,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.updateStatus(id, status, user);
  }

  @Patch(':id/tracking')
  updateTracking(
    @Param('id') id: string,
    @Body('tracking_number') trackingNumber: string,
    @Body('shipping_company') shippingCompany: string,
  ) {
    return this.ordersService.updateTracking(id, trackingNumber, shippingCompany);
  }
}
