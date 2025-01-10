import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ClinicService } from './clinic.service';
import { CreateClinicDto } from './dto/add-clinic.dto';
import { Clinic } from './entity/clininc.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { QueryRunner } from 'typeorm';
import { TransactionInterceptor } from 'src/transactions/transaction.interceptor';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';

@Controller('clinic')
@UseGuards(JwtAuthGuard)
export class ClinicController {
  constructor(
    private readonly clinicService: ClinicService,
  ) {}

  @Post('create')
  @UseInterceptors(TransactionInterceptor)
  async create(
    @Body() createClinicDto: CreateClinicDto,
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
  ): Promise<Clinic> {
    try {
      return await this.clinicService.create(createClinicDto, queryRunner);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update appointment. Something went wrong.',
      );
    }
  }
}
