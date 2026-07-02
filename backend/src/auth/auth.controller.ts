import {
  Req,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { AuthService } from './auth.service';
import {
  LoginDto,
  LogoutDto,
  RefreshDto,
  RegisterArtisanDto,
  RegisterDto,
} from './dto/auth.dto';
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
      { name: 'gallery', maxCount: 10 },
    ]),
  )
  registerArtisan(
    @Body() dto: RegisterArtisanDto,
    @UploadedFiles()
    files: {
      id_document_front?: Express.Multer.File[];
      id_document_back?: Express.Multer.File[];
      gallery?: Express.Multer.File[];
    },
    @Req() req: any,
  ) {
    const xForwardedFor = req.headers['x-forwarded-for'];
    let clientIp = '';
    if (typeof xForwardedFor === 'string') {
      clientIp = xForwardedFor.split(',')[0].trim();
    } else if (Array.isArray(xForwardedFor)) {
      clientIp = xForwardedFor[0]?.trim() || '';
    } else {
      clientIp = req.socket?.remoteAddress || req.ip || '';
    }

    return this.authService.registerArtisan(
      dto,
      files?.id_document_front?.[0],
      files?.id_document_back?.[0],
      files?.gallery,
      clientIp,
    );
  }

  @Get('verificar-email')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('recuperar-contrasena')
  requestPasswordReset(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  @Post('nueva-contrasena')
  resetPassword(@Body() body: any) {
    return this.authService.resetPassword(body.token, body.password);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refresh_token);
  }

  @Post('logout')
  logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto.refresh_token);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: any) {
    return user;
  }
}
