import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    this.fromEmail = this.configService.get<string>('MAIL_USER')!;
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.fromEmail,
        pass: this.configService.get<string>('MAIL_PASS')!,
      },
    });
  }

  async sendVerificationEmail(to: string, name: string, token: string, frontendUrl: string) {
    const link = `${frontendUrl}/auth/verificar-email?token=${token}`;
    
    console.log(`[MailService] Sending verification email to ${to}`);
    console.log(`[MailService] Verification Link: ${link}`);

    try {
      await this.transporter.sendMail({
        from: `"Art Huila" <${this.fromEmail}>`,
        to,
        subject: '🎨 Verifica tu cuenta en Art Huila',
        html: `
          <div style="font-family: Arial, sans-serif; background:#f8f4ef; padding:40px; border-radius:12px; max-width:600px; margin:0 auto;">
            <h1 style="color:#7c3d12;">¡Bienvenido/a a Art Huila, ${name}!</h1>
            <p style="color:#44403c; font-size:16px;">Gracias por registrarte. Por favor confirma tu correo electrónico haciendo clic en el botón de abajo.</p>
            <a href="${link}" style="display:inline-block; background:#dc6f21; color:#fff; padding:14px 28px; border-radius:8px; text-decoration:none; font-size:16px; margin:20px 0;">Verificar mi cuenta</a>
            <p style="color:#78716c; font-size:13px;">Este enlace expira en 48 horas. Si no creaste esta cuenta, ignora este mensaje.</p>
          </div>
        `,
      });
      console.log('[MailService] Email sent successfully');
    } catch (err) {
      console.error('[MailService] Error sending email:', err);
      throw err;
    }
  }

  async sendArtisanApprovalEmail(to: string, name: string) {
    try {
      await this.transporter.sendMail({
        from: `"Art Huila" <${this.fromEmail}>`,
        to,
        subject: '✅ ¡Tu perfil de artesano ha sido aprobado! | Art Huila',
        html: `
          <div style="font-family: Arial, sans-serif; background:#f0fdf4; padding:40px; border-radius:12px; max-width:600px; margin:0 auto;">
            <h1 style="color:#166534;">¡Felicitaciones, ${name}!</h1>
            <p style="color:#15803d; font-size:16px;">Tu perfil de artesano ha sido verificado y aprobado. Ya puedes publicar tus productos en Art Huila.</p>
            <p style="color:#44403c; font-size:14px;">Ingresa a tu dashboard de artesano para comenzar.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('[MailService] Error sending artisan approval email:', err);
      throw err;
    }
  }

  async sendArtisanRejectionEmail(to: string, name: string, reason: string) {
    try {
      await this.transporter.sendMail({
        from: `"Art Huila" <${this.fromEmail}>`,
        to,
        subject: 'Tu perfil de artesano requiere ajustes | Art Huila',
        html: `
          <div style="font-family: Arial, sans-serif; background:#fef2f2; padding:40px; border-radius:12px; max-width:600px; margin:0 auto;">
            <h1 style="color:#991b1b;">Hola ${name},</h1>
            <p style="color:#44403c; font-size:16px;">Tu perfil de artesano no pudo ser aprobado en este momento.</p>
            <p style="background:#fee2e2; padding:12px; border-radius:8px; color:#7f1d1d;"><strong>Razón:</strong> ${reason}</p>
            <p style="color:#44403c;">Si tienes dudas, contáctanos en arthuila3@gmail.com</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('[MailService] Error sending artisan rejection email:', err);
      throw err;
    }
  }

  async sendArtisanSuspensionEmail(to: string, name: string) {
    try {
      await this.transporter.sendMail({
        from: `"Art Huila" <${this.fromEmail}>`,
        to,
        subject: 'Tu cuenta ha sido suspendida | Art Huila',
        html: `
          <div style="font-family: Arial, sans-serif; background:#fff7ed; padding:40px; border-radius:12px; max-width:600px; margin:0 auto;">
            <h1 style="color:#9a3412;">Hola ${name},</h1>
            <p style="color:#44403c; font-size:16px;">Tu cuenta de artesano ha sido suspendida temporalmente por el equipo de Art Huila.</p>
            <p style="color:#44403c;">Para más información contáctanos en arthuila3@gmail.com</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('[MailService] Error sending artisan suspension email:', err);
      throw err;
    }
  }

  async sendOrderConfirmationEmail(to: string, name: string, orderId: string, total: number) {
    try {
      await this.transporter.sendMail({
        from: `"Art Huila" <${this.fromEmail}>`,
        to,
        subject: ` Confirmación de pedido | Art Huila`,
        html: `
          <div style="font-family: Arial, sans-serif; background:#fdfcfb; padding:40px; border-radius:12px; max-width:600px; margin:0 auto; border:1px solid #eee;">
            <h1 style="color:#7c3d12;">¡Gracias por tu compra, ${name}!</h1>
            <p style="color:#44403c; font-size:16px;">Hemos recibido tu pedido y los artesanos ya están trabajando en él.</p>
            <div style="background:#f8f4ef; padding:20px; border-radius:8px; margin:20px 0;">
              <p><strong>Pedido ID:</strong> ${orderId.substring(0,8)}</p>
              <p><strong>Total:</strong> $${Number(total).toLocaleString('es-CO')}</p>
            </div>
            <p style="color:#44403c;">Puedes ver el estado de tu pedido en tu panel de comprador.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('[MailService] Error sending order confirmation email:', err);
      throw err;
    }
  }

  async sendSaleNotificationEmail(to: string, artisanName: string, productName: string, quantity: number) {
    try {
      await this.transporter.sendMail({
        from: `"Art Huila" <${this.fromEmail}>`,
        to,
        subject: `💰 ¡Has realizado una venta! | Art Huila`,
        html: `
          <div style="font-family: Arial, sans-serif; background:#f0f9ff; padding:40px; border-radius:12px; max-width:600px; margin:0 auto;">
            <h1 style="color:#0369a1;">¡Buenas noticias, ${artisanName}!</h1>
            <p style="color:#0c4a6e; font-size:16px;">Un cliente ha comprado tu producto: <strong>${productName}</strong>.</p>
            <p><strong>Cantidad:</strong> ${quantity}</p>
            <p style="color:#44403c; margin-top:20px;">Ingresa a tu panel para gestionar el envío.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('[MailService] Error sending sale notification email:', err);
      throw err;
    }
  }

  async sendArtisanResponseEmail(to: string, buyerName: string, artisanName: string, productName: string) {
    try {
      await this.transporter.sendMail({
        from: `"Art Huila" <${this.fromEmail}>`,
        to,
        subject: `💬 El artesano ha respondido a tu reseña | Art Huila`,
        html: `
          <div style="font-family: Arial, sans-serif; background:#fdfcfb; padding:40px; border-radius:12px; max-width:600px; margin:0 auto; border:1px solid #eee;">
            <h1 style="color:#7c3d12;">Hola ${buyerName},</h1>
            <p style="color:#44403c; font-size:16px;">El artesano <strong>${artisanName}</strong> ha respondido a la reseña que dejaste sobre el producto <strong>${productName}</strong>.</p>
            <p style="color:#44403c; margin-top:20px;">Puedes ver la respuesta directamente en la página del producto.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('[MailService] Error sending artisan response email:', err);
      throw err;
    }
  }
}
