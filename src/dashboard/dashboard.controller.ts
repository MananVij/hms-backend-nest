import { Controller, Get, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get(':id')
  async getDashboardData(@Param('id') id: string): Promise<any> {
    return await this.dashboardService.getDashboard(id);
  }
}
