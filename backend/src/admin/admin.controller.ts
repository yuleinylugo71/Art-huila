import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('artisans')
  getArtisans(@Query('status') status?: string) {
    return this.adminService.getArtisans(status);
  }

  @Patch('artisans/:id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.approveArtisan(user.id, id);
  }

  @Patch('artesanos/:id/verificar')
  verificarArtesano(@Param('id') id: string, @Body('reason') reason: string, @CurrentUser() user: any) {
    return this.adminService.verifyArtisan(user.id, id, reason);
  }

  @Patch('artisans/:id/reject')
  reject(@Param('id') id: string, @Body('reason') reason: string, @CurrentUser() user: any) {
    return this.adminService.rejectArtisan(user.id, id, reason);
  }

  @Patch('artisans/:id/suspend')
  suspend(@Param('id') id: string, @Body('reason') reason: string, @CurrentUser() user: any) {
    return this.adminService.suspendArtisan(user.id, id, reason);
  }

  @Patch('artesanos/:id/suspender')
  suspenderArtesano(@Param('id') id: string, @Body('reason') reason: string, @CurrentUser() user: any) {
    return this.adminService.suspendArtisan(user.id, id, reason);
  }

  @Get('artesanos/:id/auditoria')
  getArtisanAudit(@Param('id') id: string) {
    return this.adminService.getArtisanAudit(id);
  }

  @Get('orders')
  getOrders(@Query('start') start?: string, @Query('end') end?: string) {
    return this.adminService.getAllOrders(start, end);
  }

  @Delete('reviews/:id')
  deleteReview(@Param('id') id: string, @Body('reason') reason: string, @CurrentUser() user: any) {
    return this.adminService.deleteReview(user.id, id, reason);
  }

  @Get('audit')
  getAuditLogs() {
    return this.adminService.getAuditLogs();
  }

  @Get('products')
  getProducts() {
    return this.adminService.getAllProducts();
  }

  @Patch('products/:id/hide')
  hideProduct(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.hideProduct(user.id, id);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.deleteProduct(user.id, id);
  }

  @Get('reviews/reported')
  getReportedReviews() {
    return this.adminService.getReportedReviews();
  }

  @Patch('reviews/:id/keep')
  keepReview(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.keepReview(user.id, id);
  }
}
