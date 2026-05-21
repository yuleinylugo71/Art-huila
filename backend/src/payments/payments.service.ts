import { Injectable, InternalServerErrorException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order } from '../orders/entities/order.entity';
import { OrdersService } from '../orders/orders.service';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => OrdersService))
    private ordersService: OrdersService,
  ) {}

  async createPreference(order: Order) {
    // This method is kept for compatibility with the controller,
    // though the frontend initiates ePayco directly.
    return { status: 'epayco-direct' };
  }

  async handleWebhook(data: any) {
    try {
      const p_cust_id_client = this.configService.get<string>('EPAYCO_P_CUST_ID');
      const p_key = this.configService.get<string>('EPAYCO_P_KEY');

      const x_ref_payco = data.x_ref_payco;
      const x_transaction_id = data.x_transaction_id;
      const x_amount = data.x_amount;
      const x_currency_code = data.x_currency_code;
      const x_signature = data.x_signature;
      const x_id_invoice = data.x_id_invoice; // This is the order ID

      if (!x_ref_payco || !x_transaction_id || !x_amount || !x_currency_code || !x_signature) {
        console.warn('Incomplete ePayco webhook data');
        return;
      }

      const signature = crypto
        .createHash('sha256')
        .update(`${p_cust_id_client}^${p_key}^${x_ref_payco}^${x_transaction_id}^${x_amount}^${x_currency_code}`)
        .digest('hex');

      if (signature === x_signature) {
        const x_cod_response = data.x_cod_response;
        // 1 Aceptada, 2 Rechazada, 3 Pendiente, 4 Fallida
        if (x_cod_response === 1 || x_cod_response === '1') {
          if (x_id_invoice) {
            await this.ordersService.markAsPaid(x_id_invoice, x_ref_payco);
            console.log(`Order ${x_id_invoice} marked as PAID via Webhook (ePayco)`);
          }
        }
      } else {
        console.warn('Invalid ePayco webhook signature');
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
    }
  }
}
