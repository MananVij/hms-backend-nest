import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrescriptionTemplateService } from './prescription-template.service';
import {
  CreatePrescriptionTemplateDto,
  UpdatePrescriptionTemplateDto,
} from './dto/prescription-template.dto';
import { Request } from '../interfaces/request.interface';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';
import { QueryRunner } from 'typeorm';

@Controller('prescription-templates')
@UseGuards(JwtAuthGuard)
export class PrescriptionTemplateController {
  constructor(private readonly templateService: PrescriptionTemplateService) {}

  @Post()
  create(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Body() createDto: CreatePrescriptionTemplateDto,
    @Req() req: Request,
  ) {
    console.log('createDto', createDto);
    const userId = req.user.uid;
    return this.templateService.create(queryRunner, createDto, userId);
  }

  @Get()
  findAll(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Req() req: Request,
  ) {
    const userId = req.user.uid;
    return this.templateService.findAll(queryRunner, userId);
  }

  @Get(':id')
  findOne(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    console.log('Fetching template detail for ID:', id);
    const userId = req.user.uid;
    return this.templateService.findOne(queryRunner, id, userId);
  }

  @Patch(':id')
  update(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Param('id') id: string,
    @Body() updateDto: UpdatePrescriptionTemplateDto,
    @Req() req: Request,
  ) {
    const userId = req.user.uid;
    return this.templateService.update(queryRunner, id, updateDto, userId);
  }

  @Delete(':id')
  remove(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const userId = req.user.uid;
    return this.templateService.remove(queryRunner, id, userId);
  }

  @Patch(':id/update-default')
  updateDefault(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const userId = req.user.uid;
    return this.templateService.updateDefault(queryRunner, id, userId);
  }
}
