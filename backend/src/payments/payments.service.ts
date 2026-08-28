import {
  Injectable,
  InternalServerErrorException,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
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
    const publicKey = this.configService.get<string>('EPAYCO_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('EPAYCO_PRIVATE_KEY');

    if (!publicKey || !privateKey) {
      if (this.isDemoPaymentsAllowed()) {
        return this.createDemoPreference(
          'No hay credenciales de ePayco configuradas.',
        );
      }

      throw new BadRequestException(
        'Faltan las credenciales de ePayco. Configura EPAYCO_PUBLIC_KEY y EPAYCO_PRIVATE_KEY.',
      );
    }

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:3000';
    const backendUrl = this.getBackendApiUrl();
    const amount = Math.round(Number(order.total_amount));

    const authHeader = Buffer.from(`${publicKey}:${privateKey}`).toString(
      'base64',
    );

    let authData: any;
    try {
      const response = await fetch('https://apify.epayco.co/login', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
      });

      authData = await response.json().catch(() => null);
      if (!response.ok || !authData?.token) {
        if (this.isDemoPaymentsAllowed()) {
          return this.createDemoPreference(
            'ePayco no autentico la cuenta. Se usa modo demostracion.',
          );
        }

        throw new BadRequestException(
          'No se pudo autenticar con ePayco. Revisa que las llaves correspondan a una cuenta activa.',
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (this.isDemoPaymentsAllowed()) {
        return this.createDemoPreference(
          'No se pudo conectar con ePayco. Se usa modo demostracion.',
        );
      }

      throw new BadRequestException(
        'No se pudo conectar con ePayco. Revisa tu conexion o intenta de nuevo.',
      );
    }

    let sessionResponse: Response;
    try {
      sessionResponse = await fetch(
        'https://apify.epayco.co/payment/session/create',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authData.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            checkout_version: '2',
            amount,
            currency: 'COP',
            name: 'Compra Art Huila',
            description: `Pedido Art Huila #${order.id.slice(0, 8)}`,
            invoice: order.id,
            country: 'CO',
            lang: 'ES',
            taxBase: amount,
            tax: 0,
            method: 'GET',
            response: `${frontendUrl}/pago-resultado.html?order_id=${order.id}`,
            confirmation: `${backendUrl}/payments/webhook`,
            extra1: order.id,
          }),
        },
      );
    } catch {
      if (this.isDemoPaymentsAllowed()) {
        return this.createDemoPreference(
          'No se pudo conectar con ePayco para crear la sesion. Se usa modo demostracion.',
        );
      }

      throw new BadRequestException(
        'No se pudo conectar con ePayco para crear la sesion de pago.',
      );
    }

    const sessionData = await sessionResponse.json().catch(() => null);
    const sessionId =
      sessionData?.data?.sessionId ||
      sessionData?.sessionId ||
      sessionData?.id;

    if (!sessionResponse.ok || !sessionId) {
      if (this.isDemoPaymentsAllowed()) {
        return this.createDemoPreference(
          'ePayco no pudo crear la sesion de pago. Se usa modo demostracion.',
        );
      }

      throw new BadRequestException(
        `No se pudo crear la sesion de pago en ePayco: ${JSON.stringify(
          sessionData,
        )}`,
      );
    }

    return {
      publicKey,
      sessionId,
      test: this.configService.get<string>('EPAYCO_TEST') !== 'false',
    };
  }

  private isDemoPaymentsAllowed() {
    return (
      this.configService.get<string>('EPAYCO_ALLOW_MOCK_PAYMENTS') === 'true'
    );
  }

  private createDemoPreference(reason: string) {
    return {
      mode: 'demo',
      test: true,
      reason,
      message:
        'Modo demostracion habilitado. No se cobrara dinero real y el pedido se aprobara desde el entorno de prueba.',
    };
  }

  private getBackendApiUrl() {
    const configured =
      this.configService.get<string>('BACKEND_URL_PUBLIC') ||
      'http://localhost:3000';
    const clean = configured.replace(/\/+$/, '');
    return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
  }

  async handleWebhook(data: any) {
    try {
      const p_cust_id_client =
        this.configService.get<string>('EPAYCO_P_CUST_ID') ||
        this.configService.get<string>('EPAYCO_P_CUST_ID_CLIENTE');
      const p_key =
        this.configService.get<string>('EPAYCO_P_KEY') ||
        this.configService.get<string>('EPAYCO_PRIVATE_KEY');

      const x_ref_payco = data.x_ref_payco;
      const x_transaction_id = data.x_transaction_id;
      const x_amount = data.x_amount;
      const x_currency_code = data.x_currency_code;
      const x_signature = data.x_signature;
      const x_id_invoice = data.x_id_invoice; // This is the order ID

      if (
        !x_ref_payco ||
        !x_transaction_id ||
        !x_amount ||
        !x_currency_code ||
        !x_signature
      ) {
        console.warn('Incomplete ePayco webhook data');
        return;
      }

      const signature = crypto
        .createHash('sha256')
        .update(
          `${p_cust_id_client}^${p_key}^${x_ref_payco}^${x_transaction_id}^${x_amount}^${x_currency_code}`,
        )
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
            await this.ordersService.markPaymentApproved(
              x_id_invoice,
              x_ref_payco,
            );
            console.log(`[EPAYCO] Order ${x_id_invoice} approved`);
          } else if (
            x_cod_response === 2 ||
            x_transaction_state === 'Rechazada' ||
            x_transaction_state === 'Rejected'
          ) {
            await this.ordersService.markPaymentRejected(
              x_id_invoice,
              x_ref_payco,
            );
            console.log(`[EPAYCO] Order ${x_id_invoice} rejected`);
          } else if (
            x_cod_response === 3 ||
            x_transaction_state === 'Pendiente' ||
            x_transaction_state === 'Pending'
          ) {
            await this.ordersService.markPaymentPending(
              x_id_invoice,
              x_ref_payco,
            );
            console.log(`[EPAYCO] Order ${x_id_invoice} pending`);
          } else if (
            x_cod_response === 4 ||
            x_transaction_state === 'Fallida' ||
            x_transaction_state === 'Failed'
          ) {
            await this.ordersService.markPaymentFailed(
              x_id_invoice,
              x_ref_payco,
            );
            console.log(`[EPAYCO] Order ${x_id_invoice} failed`);
          } else if (
            x_cod_response === 10 ||
            x_transaction_state === 'Cancelada' ||
            x_transaction_state === 'Cancelled'
          ) {
            await this.ordersService.markPaymentCancelled(
              x_id_invoice,
              x_ref_payco,
            );
            console.log(`[EPAYCO] Order ${x_id_invoice} cancelled`);
          } else {
            console.warn(
              `[EPAYCO] Unknown response code ${x_cod_response} / status ${x_transaction_state} for Order ${x_id_invoice}`,
            );
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
