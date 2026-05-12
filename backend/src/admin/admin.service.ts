import { Injectable, BadRequestException } from '@nestjs/common';
import { ArtisansService } from '../artisans/artisans.service';
import { MailService } from '../mail/mail.service';
import { AuditService } from '../audit/audit.service';
import { VerificationStatus } from '../artisans/entities/artisan-profile.entity';
import { AuditAction } from '../audit/entities/admin-audit-log.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly artisansService: ArtisansService,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
    private readonly usersService: UsersService,
  ) {}

  async getArtisans(status?: string) {
    return this.artisansService.findAll(status);
  }

  async approveArtisan(adminId: string, artisanProfileId: string) {
    const profile = await this.artisansService.findById(artisanProfileId);
    if (!profile) throw new BadRequestException('Perfil no encontrado');
    await this.artisansService.updateStatus(artisanProfileId, VerificationStatus.VERIFIED);
    const admin = await this.usersService.findById(adminId);
    await this.auditService.log(admin!, AuditAction.APPROVE_ARTISAN, artisanProfileId, 'Artesano aprobado');
    await this.mailService.sendArtisanApprovalEmail(profile.user.email, profile.user.full_name);
    return { message: 'Artesano aprobado y notificado' };
  }

  async rejectArtisan(adminId: string, artisanProfileId: string, reason: string) {
    if (!reason) throw new BadRequestException('La razón de rechazo es obligatoria');
    const profile = await this.artisansService.findById(artisanProfileId);
    if (!profile) throw new BadRequestException('Perfil no encontrado');
    await this.artisansService.updateStatus(artisanProfileId, VerificationStatus.REJECTED, reason);
    const admin = await this.usersService.findById(adminId);
    await this.auditService.log(admin!, AuditAction.REJECT_ARTISAN, artisanProfileId, reason);
    await this.mailService.sendArtisanRejectionEmail(profile.user.email, profile.user.full_name, reason);
    return { message: 'Artesano rechazado y notificado' };
  }

  async suspendArtisan(adminId: string, artisanProfileId: string) {
    const profile = await this.artisansService.findById(artisanProfileId);
    if (!profile) throw new BadRequestException('Perfil no encontrado');
    await this.artisansService.updateStatus(artisanProfileId, VerificationStatus.SUSPENDED);
    const admin = await this.usersService.findById(adminId);
    await this.auditService.log(admin!, AuditAction.SUSPEND_ARTISAN, artisanProfileId, 'Artesano suspendido');
    await this.mailService.sendArtisanSuspensionEmail(profile.user.email, profile.user.full_name);
    return { message: 'Artesano suspendido y notificado' };
  }
}
