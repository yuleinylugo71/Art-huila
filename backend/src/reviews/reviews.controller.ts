import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: any, @Body() body: { productId: string; rating: number; comment: string }) {
    return this.reviewsService.create(user.id, body);
  }

  @Get('product/:productId')
  findByProduct(@Param('productId') productId: string) {
    return this.reviewsService.findByProduct(productId);
  }

  @Patch(':id/report')
  reportReview(@Param('id') id: string, @Body('reason') reason: string) {
    return this.reviewsService.report(id, reason);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('artesano')
  @Patch(':id/respond')
  respond(@Param('id') id: string, @CurrentUser() user: any, @Body('response') response: string) {
    return this.reviewsService.respond(id, user.id, response);
  }
}
