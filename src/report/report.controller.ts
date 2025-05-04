import { Body, Controller, Get, Param, Post, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { ReportService } from "./report.service";
import { TransactionInterceptor } from "src/transactions/transaction.interceptor";
import { QueryRunnerParam } from "src/transactions/query_runner_param";
import { QueryRunner } from "typeorm";
import { CreateReportDto } from "./create-report.dto";

@Controller('report')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @UseInterceptors(TransactionInterceptor)
  async createReport(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Body() body: CreateReportDto
  ) {
    return await this.reportService.createReport(body, queryRunner);
  }
}
