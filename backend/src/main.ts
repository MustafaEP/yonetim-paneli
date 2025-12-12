import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 🔹 CORS ayarları
  app.enableCors({
    origin: configService.corsOrigin,
    credentials: configService.corsCredentials,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });

  // 🔹 Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO'da tanımlı olmayan property'leri otomatik kaldır
      forbidNonWhitelisted: true, // Tanımlı olmayan property varsa hata fırlat
      transform: true, // Gelen veriyi DTO tipine otomatik dönüştür
      transformOptions: {
        enableImplicitConversion: true, // String'leri number'a otomatik çevir
      },
    }),
  );

  // 🔹 Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // 🔹 Global Interceptor (Logging)
  app.useGlobalInterceptors(new LoggingInterceptor());

  // 🔹 Swagger/OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('Yönetim Paneli API')
    .setDescription('Yönetim Paneli Backend API Dokümantasyonu')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(configService.port);
  console.log(`🚀 Application is running on: http://localhost:${configService.port}`);
  console.log(`📚 Swagger documentation: http://localhost:${configService.port}/api`);
}
bootstrap();
