import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
  Query,
} from '@nestjs/common';
import { ReportTemplateService } from './report-template.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { QueryRunner } from 'typeorm';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';
import { CreateReportTemplateDto } from './create-report-template.dto';

@Controller('report-templates')
@UseGuards(JwtAuthGuard)
export class ReportTemplateController {
  constructor(private readonly reportTemplateService: ReportTemplateService) {}

  @Post()
  async createTemplate(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Body() dto: CreateReportTemplateDto,
  ) {
    throw new ForbiddenException(
      'Only admins can create new templates. Contact admin at hello@caresphere.in or +91 6284191695 with template details.',
    );
    return this.reportTemplateService.createTemplate(dto, queryRunner);
  }

  @Get()
  async getTemplates(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Query('doctorId') doctorId: string,
  ) {
    try {
      return await this.reportTemplateService.getTemplatesByDoctor(
        doctorId,
        queryRunner,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error fetching templates');
    }
  }

  @Get(':id')
  async getTemplate(
    @Param('id') id: string,
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Query('doctorId') doctorId: string,
    @Query('clinicId') clinicId: number,
  ) {
    return this.reportTemplateService.findOneWithPadding(
      id,
      doctorId,
      clinicId,
      queryRunner,
    );
  }
}
