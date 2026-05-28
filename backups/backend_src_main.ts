import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:8080'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api/v1', { exclude: ['sitemap.xml', '/'] });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Art Huila API running at http://localhost:${port}`);
  console.log(`📦 API prefix: /api/v1`);
}
bootstrap();