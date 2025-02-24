import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [ConfigModule], // Import ConfigModule
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const store = await redisStore.redisStore({
          host: configService.get<string>('REDIS_HOST'), // Use ConfigService to get REDIS_HOST
          port: configService.get<number>('REDIS_PORT'), // Use ConfigService to get REDIS_PORT
        });
        return store;
      },
      inject: [ConfigService], // Inject ConfigService into the factory
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', RedisService], // Export both REDIS_CLIENT and RedisService
})
export class RedisModule {}