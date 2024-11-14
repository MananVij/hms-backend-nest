import * as dotenv from 'dotenv';
dotenv.config({ path: process.cwd() + '/src/.env' });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin:'*', // Replace with your frontend domain
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Enable credentials (if needed)
  });
  app.useGlobalPipes(new ValidationPipe());
  console.log(`Server Started at ${process.env.PORT}`)
  await app.listen(process.env.PORT || 8000);
}
bootstrap();
