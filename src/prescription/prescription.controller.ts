import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  NotFoundException,
  InternalServerErrorException,
  Req,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { PrescriptionService } from './prescription.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { Prescription } from './entity/prescription.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { QueryRunner } from 'typeorm';
import { TransactionInterceptor } from 'src/transactions/transaction.interceptor';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';
import { Request } from 'src/interfaces/request.interface';

@Controller('prescriptions')
@UseGuards(JwtAuthGuard)
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Post('create')
  @UseInterceptors(TransactionInterceptor)
  async create(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Req() req: Request,
    @Query('clinicId') clinicId: number,
    @Body() createPrescriptionDto: CreatePrescriptionDto,
  ): Promise<Prescription> {
    const doctorId = req?.user?.uid;
    try {
      return await this.prescriptionService.create(
        createPrescriptionDto,
        queryRunner,
        doctorId,
        clinicId,
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Unable to save prescription. Something went wrong.',
      );
    }
  }
}
