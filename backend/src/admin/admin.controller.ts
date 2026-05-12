import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/v1/admin')
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

  @Patch('artisans/:id/reject')
  reject(@Param('id') id: string, @Body('reason') reason: string, @CurrentUser() user: any) {
    return this.adminService.rejectArtisan(user.id, id, reason);
  }

  @Patch('artisans/:id/suspend')
  suspend(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.suspendArtisan(user.id, id);
  }
}
