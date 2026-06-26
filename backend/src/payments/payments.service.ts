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
      const p_cust_id_client = this.configService.get<string>('EPAYCO_P_CUST_ID') || this.configService.get<string>('EPAYCO_P_CUST_ID_CLIENTE');
      const p_key = this.configService.get<string>('EPAYCO_P_KEY') || this.configService.get<string>('EPAYCO_PRIVATE_KEY');

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
        const x_cod_response = Number(data.x_cod_response);
        const x_transaction_state = data.x_transaction_state;

        if (x_id_invoice) {
          if (
            x_cod_response === 1 || 
            x_transaction_state === 'Aceptada' ||
            x_transaction_state === 'Approved'
          ) {
            await this.ordersService.markPaymentApproved(x_id_invoice, x_ref_payco);
            console.log(`[EPAYCO] Order ${x_id_invoice} approved`);
          } else if (
            x_cod_response === 2 ||
            x_transaction_state === 'Rechazada' ||
            x_transaction_state === 'Rejected'
          ) {
            await this.ordersService.markPaymentRejected(x_id_invoice, x_ref_payco);
            console.log(`[EPAYCO] Order ${x_id_invoice} rejected`);
          } else if (
            x_cod_response === 3 ||
            x_transaction_state === 'Pendiente' ||
            x_transaction_state === 'Pending'
          ) {
            await this.ordersService.markPaymentPending(x_id_invoice, x_ref_payco);
            console.log(`[EPAYCO] Order ${x_id_invoice} pending`);
          } else if (
            x_cod_response === 4 ||
            x_transaction_state === 'Fallida' ||
            x_transaction_state === 'Failed'
          ) {
            await this.ordersService.markPaymentFailed(x_id_invoice, x_ref_payco);
            console.log(`[EPAYCO] Order ${x_id_invoice} failed`);
          } else if (
            x_cod_response === 10 ||
            x_transaction_state === 'Cancelada' ||
            x_transaction_state === 'Cancelled'
          ) {
            await this.ordersService.markPaymentCancelled(x_id_invoice, x_ref_payco);
            console.log(`[EPAYCO] Order ${x_id_invoice} cancelled`);
          } else {
            console.warn(`[EPAYCO] Unknown response code ${x_cod_response} / status ${x_transaction_state} for Order ${x_id_invoice}`);
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
