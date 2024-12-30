import * as dotenv from 'dotenv';
dotenv.config({ path: process.cwd() + '/src/.env' });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionInterceptor } from './transactions/transaction.interceptor';
import { GeoLocationMiddleware } from './geolocation/geolocation.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);
  app.enableCors({
    origin: [process.env.FRONT_END_DOMAIN], // Replace with your frontend domain
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Enable credentials (if needed)
    allowedHeaders: 'Content-Type, Authorization',
  });
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new TransactionInterceptor(dataSource));
  app.use(new GeoLocationMiddleware().use);

  const port = process.env.PORT || 3000;
  console.log(`Server Started at ${port}`);
  await app.listen(port, '0.0.0.0');
}
bootstrap();
