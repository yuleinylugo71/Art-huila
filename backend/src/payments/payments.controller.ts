import { Controller, Post, Body, Param, UseGuards, Get, Query, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrdersService } from '../orders/orders.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly ordersService: OrdersService,
    private readonly configService: ConfigService,
  ) {}

  @Get('epayco-config')
  @UseGuards(JwtAuthGuard)
  async getEpaycoConfig() {
    return {
      publicKey: this.configService.get<string>('EPAYCO_PUBLIC_KEY'),
    };
  }

  @Post('create-preference/:orderId')
  @UseGuards(JwtAuthGuard)
  async createPreference(@Param('orderId') orderId: string, @CurrentUser() user: any) {
    const order = await this.ordersService.findOne(orderId, user);
    if (!order) throw new NotFoundException('Order not found');
    return this.paymentsService.createPreference(order);
  }

  @Post('webhook')
  async handleWebhook(@Body() body: any, @Query() query: any) {
    console.log('Webhook received:', { body, query });
    // Combine body and query for broader compatibility
    await this.paymentsService.handleWebhook({ ...body, ...query });
    return { status: 'ok' };
  }
}
