import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🔹 CORS ayarları: React dev server: http://localhost:5173
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: false, // şimdilik cookie kullanmıyoruz
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
