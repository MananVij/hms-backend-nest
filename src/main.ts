import * as dotenv from 'dotenv';
dotenv.config({ path: process.cwd() + '/src/.env' });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionInterceptor } from './transactions/transaction.interceptor';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(bodyParser.json({ limit: '5mb' }));
  app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));
  const dataSource = app.get(DataSource);
  app.enableCors({
    origin: [process.env.FRONT_END_DOMAIN],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization, sentry-trace, baggage',
  });
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new TransactionInterceptor(dataSource));

  const port = process.env.PORT || 3000;
  console.log(`Server Started at ${port}`);
  await app.listen(port, '0.0.0.0');
}
bootstrap();
