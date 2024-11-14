import * as dotenv from 'dotenv';
dotenv.config({ path: process.cwd() + '/src/.env' });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
if (!process.env.DB_HOST_URL || !process.env.DB_PORT || !process.env.DB_PASSWORD || !process.env.DB_USER_NAME) {
  console.error('Database environment variables are missing mamnanm!');
  process.exit(1);  // Exit the process if the environment variables are missing
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin:'*', // Replace with your frontend domain
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Enable credentials (if needed)
  });
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT || 8000);
}
bootstrap();
