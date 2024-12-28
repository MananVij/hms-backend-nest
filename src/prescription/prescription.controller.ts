import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrescriptionService } from './prescription.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { Prescription } from './entity/prescription.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { QueryRunner } from 'typeorm';
import { TransactionInterceptor } from 'src/transactions/transaction.interceptor';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';

@Controller('prescriptions')
@UseGuards(JwtAuthGuard)
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Post('create')
  @UseInterceptors(TransactionInterceptor)
  async create(
    @Body() createPrescriptionDto: CreatePrescriptionDto,
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
  ): Promise<Prescription> {
    try {
      return await this.prescriptionService.create(
        createPrescriptionDto,
        queryRunner,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Unable to save prescription. Something went wrong.',
      );
    }
  }

  @Get('doctor')
  async findPrescriptionsByDoctor(
    @Param('id') id: string,
  ): Promise<Prescription[]> {
    return await this.prescriptionService.findPrescriptionsByDoctor(id);
  }

  // Get prescriptions by patient ID
  @Get('patient/:id')
  async findPrescriptionsByPatient(
    @Param('id') id: string,
  ): Promise<Prescription[]> {
    return await this.prescriptionService.findPrescriptionsOfPatient(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Prescription> {
    return await this.prescriptionService.findOne(id);
  }
}
