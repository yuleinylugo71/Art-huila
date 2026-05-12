"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const resend_1 = require("resend");
let MailService = class MailService {
    configService;
    resend;
    fromEmail;
    constructor(configService) {
        this.configService = configService;
        this.resend = new resend_1.Resend(this.configService.get('RESEND_API_KEY'));
        this.fromEmail = this.configService.get('FROM_EMAIL') || 'onboarding@resend.dev';
    }
    async sendVerificationEmail(to, name, token, frontendUrl) {
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
    async sendArtisanApprovalEmail(to, name) {
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
    async sendArtisanRejectionEmail(to, name, reason) {
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
    async sendArtisanSuspensionEmail(to, name) {
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
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map