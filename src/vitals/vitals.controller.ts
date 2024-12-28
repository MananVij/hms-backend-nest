import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  Query,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { VitalsService } from './vitals.service';
import { CreateVitalsDto } from './dto/create-vitals.dto';
import { Vitals } from './entity/vitals.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { QueryRunner } from 'typeorm';
import { TransactionInterceptor } from 'src/transactions/transaction.interceptor';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';

@Controller('vitals')
@UseGuards(JwtAuthGuard)
export class VitalsController {
  constructor(private readonly vitalsService: VitalsService) {}

  @Post()
  @UseInterceptors(TransactionInterceptor)
  async createVitals(
    @Body() createVitalsDto: CreateVitalsDto,
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
  ): Promise<any> {
    try {
      return this.vitalsService.createVitals(createVitalsDto, queryRunner);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Something went wrong. Failed to update metadata.',
      );
    }
  }

  @Get(':prescriptionId')
  async getVitalsByPrescription(
    @Param('prescriptionId') prescriptionId: number,
  ): Promise<Vitals[]> {
    return this.vitalsService.getVitalsByPrescription(prescriptionId);
  }

  @Get('/latest/:userId')
  async getLatestVitalsByUser(
    @Param('userId') userId: string,
  ): Promise<Vitals> {
    return this.vitalsService.getLatestVitalsByUser(userId);
  }
}
