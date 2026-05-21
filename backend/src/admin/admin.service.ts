import { Injectable, BadRequestException } from '@nestjs/common';
import { Between } from 'typeorm';
import { ArtisansService } from '../artisans/artisans.service';
import { MailService } from '../mail/mail.service';
import { AuditService } from '../audit/audit.service';
import { VerificationStatus } from '../artisans/entities/artisan-profile.entity';
import { AuditAction } from '../audit/entities/admin-audit-log.entity';
import { UsersService } from '../users/users.service';
import { OrdersService } from '../orders/orders.service';
import { ReviewsService } from '../reviews/reviews.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly artisansService: ArtisansService,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
    private readonly reviewsService: ReviewsService,
    private readonly productsService: ProductsService,
  ) {}

  async getArtisans(status?: string) {
    const artisans = await this.artisansService.findAll(status);
    return Promise.all(artisans.map(a => this.artisansService.findById(a.id)));
  }

  async approveArtisan(adminId: string, artisanProfileId: string) {
    const profile = await this.artisansService.findById(artisanProfileId);
    if (!profile) throw new BadRequestException('Perfil no encontrado');
    
    if (profile.verification_status === VerificationStatus.VERIFIED) {
      throw new BadRequestException('El artesano ya fue aprobado anteriormente');
    }

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

  async getAllOrders(start?: string, end?: string) {
    if (start && end) {
      return this.ordersService['ordersRepository'].find({
        where: { created_at: Between(new Date(start), new Date(end)) },
        relations: ['user', 'items', 'items.product', 'items.product.artisan'],
        order: { created_at: 'DESC' },
      });
    }
    return this.ordersService.findAll();
  }

  async deleteReview(adminId: string, reviewId: string, reason: string) {
    const review = await this.reviewsService.findOne(reviewId);
    if (!review) throw new BadRequestException('Reseña no encontrada');
    
    await this.reviewsService.remove(reviewId);
    const admin = await this.usersService.findById(adminId);
    await this.auditService.log(admin!, AuditAction.DELETE_REVIEW, reviewId, `Razón: ${reason}`);
    
    return { message: 'Reseña eliminada correctamente' };
  }

  async keepReview(adminId: string, reviewId: string) {
    await this.reviewsService.resetReport(reviewId);
    return { message: 'Reporte de reseña descartado' };
  }

  async getReportedReviews() {
    return this.reviewsService.findReported();
  }

  async getAllProducts() {
    return this.productsService.findAll();
  }

  async hideProduct(adminId: string, productId: string) {
    await this.productsService.hide(productId);
    const admin = await this.usersService.findById(adminId);
    await this.auditService.log(admin!, AuditAction.HIDE_PRODUCT, productId, 'Producto ocultado por admin');
    return { message: 'Producto ocultado' };
  }

  async deleteProduct(adminId: string, productId: string) {
    await this.productsService.remove(productId);
    const admin = await this.usersService.findById(adminId);
    await this.auditService.log(admin!, AuditAction.DELETE_PRODUCT, productId, 'Producto eliminado por admin');
    return { message: 'Producto eliminado' };
  }

  async getAuditLogs() {
    return this.auditService.findAll();
  }
}
