import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Servir archivos estáticos del frontend desde la carpeta public (Monolito Unificado)
  const publicPath = join(process.cwd(), 'public');
  console.log(`📁 Servir archivos estáticos desde: ${publicPath}`);
  app.use(express.static(publicPath));

  const frontendUrl = process.env.FRONTEND_URL;
  const origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:8080',
  ];
  if (frontendUrl) {
    const splitOrigins = frontendUrl.split(',').map((o) => o.trim());
    splitOrigins.forEach((o) => {
      if (o && !origins.includes(o)) {
        origins.push(o);
      }
    });
  }

  app.enableCors({
    origin: origins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.setGlobalPrefix('api/v1', { exclude: ['sitemap.xml', '/'] });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Art Huila API running at http://localhost:${port}`);
  console.log(`📦 API prefix: /api/v1`);
}
bootstrap();
