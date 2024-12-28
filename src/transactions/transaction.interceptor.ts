import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { DataSource } from 'typeorm';
import { catchError, finalize } from 'rxjs/operators';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect(); // Ensure connection
    await queryRunner.startTransaction(); // Start transaction

    const request = context.switchToHttp().getRequest();
    request.queryRunner = queryRunner; // Attach queryRunner to request

    return next.handle().pipe(
      catchError(async (error) => {
        if (queryRunner.isTransactionActive) {
          console.log('Trans Rollback Error:', error);
          await queryRunner.rollbackTransaction(); // Rollback only if active
        }
        throw error;
      }),
      finalize(async () => {
        if (queryRunner.isTransactionActive) {
          await queryRunner.commitTransaction();
        }
        if (!queryRunner.isReleased) {
          await queryRunner.release();
        }
      }),
    );
  }
}
