import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request } from 'src/interfaces/request.interface';
import { TransactionInterceptor } from 'src/transactions/transaction.interceptor';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';
import { QueryRunner } from 'typeorm';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TransactionInterceptor)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('')
  async getDashboardData(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Req() req: Request,
    @Query('clinicId') clinicId: number,
  ): Promise<any> {
    try {
      const userId = req?.user?.uid;
      return await this.dashboardService.getDashboard(
        queryRunner,
        userId,
        clinicId,
      );
    } catch (error) {
      throw error;
    }
  }
}
