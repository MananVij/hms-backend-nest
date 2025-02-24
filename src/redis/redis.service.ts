import { Injectable, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly cacheManager: Cache) {}

  async set(key: string, value: string, ttl: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl); // Set key with TTL
  }

  async get(key: string): Promise<string | null> {
    return await this.cacheManager.get(key); // Get value by key
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key); // Delete key
  }
}