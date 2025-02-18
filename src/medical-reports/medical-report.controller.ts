import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  Body,
  Req,
  UseGuards,
  Delete,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'src/interfaces/request.interface';
import { CreateMedicalReportDto } from './dto/create-medical-reports.dto';
import { MedicalReportService } from './medical-report.service';
import { MedicalReport } from './entity/medical-reports.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TransactionInterceptor } from 'src/transactions/transaction.interceptor';
import { QueryRunner } from 'typeorm';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';
import { ShareReportDto } from 'src/report-access/dto/share-report.dto';
import { RevokeAccessDto } from 'src/report-access/dto/revoke-access.dto';

@Controller('report')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TransactionInterceptor)
export class MedicalReportController {
  constructor(private readonly reportService: MedicalReportService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFile(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: CreateMedicalReportDto,
    @Req() req: Request,
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
  ): Promise<MedicalReport> {
    const uploadedBy = req?.user?.uid;
    return this.reportService.uploadFile(queryRunner, files, dto, uploadedBy);
  }

  @Get(':id')
  async getReport(
    @Param('id') reportId: string,
    @Req() req: Request,
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
  ): Promise<MedicalReport> {
    throw new BadRequestException("Service Not In User Right Now")
    const userId = req?.user?.uid;
    return this.reportService.getReport(queryRunner, reportId, userId);
  }

  @Post(':id/share')
  async shareReport(
    @Param('id') reportId: string,
    @Body() dto: ShareReportDto,
    @Req() req: Request,
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
  ) {
    throw new BadRequestException("Service Not In User Right Now")
    const userId = req?.user?.uid;
    return this.reportService.shareReport(queryRunner, reportId, userId, dto);
  }

  @Delete(':id/access')
  async revokeAccess(
    @Param('id') reportId: string,
    @Body() dto: RevokeAccessDto,
    @Req() req: Request,
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
  ) {
    throw new BadRequestException("Service Not In User Right Now")
    const userId = req?.user?.uid;
    return this.reportService.revokeAccess(queryRunner, reportId, userId, dto);
  }
}