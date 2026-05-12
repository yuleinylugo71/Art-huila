import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
    this.fromEmail = this.configService.get<string>('FROM_EMAIL') || 'onboarding@resend.dev';
  }

  async sendVerificationEmail(to: string, name: string, token: string, frontendUrl: string) {
    const link = `${frontendUrl}/auth/verificar-email?token=${token}`;
    await this.resend.emails.send({
      from: this.fromEmail,
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
  }

  async sendArtisanApprovalEmail(to: string, name: string) {
    await this.resend.emails.send({
      from: this.fromEmail,
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
  }

  async sendArtisanRejectionEmail(to: string, name: string, reason: string) {
    await this.resend.emails.send({
      from: this.fromEmail,
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
  }

  async sendArtisanSuspensionEmail(to: string, name: string) {
    await this.resend.emails.send({
      from: this.fromEmail,
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
  }
}
