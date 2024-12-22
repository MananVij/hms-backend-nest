import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('')
  async getDashboardData(
    @Query('userId') userId: string,
    @Query('role') role: string,
  ): Promise<any> {
    return await this.dashboardService.getDashboard(userId, role);
  }
}
