import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MipaqueteService } from './mipaquete/mipaquete.service';

@Module({
  imports: [ConfigModule],
  providers: [MipaqueteService],
  exports: [MipaqueteService],
})
export class LogisticsModule {}
