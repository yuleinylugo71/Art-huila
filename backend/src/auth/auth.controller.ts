import { Body, Controller, Get, Post, Query, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto, RegisterArtisanDto, RegisterDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register/comprador')
  registerBuyer(@Body() dto: RegisterDto) {
    return this.authService.registerBuyer(dto);
  }

  @Post('register/artesano')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'id_document_front', maxCount: 1 },
      { name: 'id_document_back', maxCount: 1 },
      { name: 'gallery', maxCount: 5 },
    ]),
  )
  registerArtisan(
    @Body() dto: RegisterArtisanDto,
    @UploadedFiles() files: { id_document_front?: Express.Multer.File[], id_document_back?: Express.Multer.File[], gallery?: Express.Multer.File[] },
  ) {
    return this.authService.registerArtisan(dto, files.id_document_front?.[0], files.id_document_back?.[0], files.gallery);
  }

  @Get('verificar-email')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refresh_token);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: any) {
    return user;
  }
}
