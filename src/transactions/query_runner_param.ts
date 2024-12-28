import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { QueryRunner } from 'typeorm';

export const QueryRunnerParam = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): QueryRunner => {
    const request = ctx.switchToHttp().getRequest();
    if (!request.queryRunner) {
      throw new Error('QueryRunner not found in the request.');
    }
    return request.queryRunner;
  },
);
