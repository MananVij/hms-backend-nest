import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ClinicService } from './clinic.service';
import { CreateClinicDto } from './dto/add-clinic.dto';
import { Clinic } from './entity/clininc.entity';
import { UpdateClinicDto } from './dto/update-clininc.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { QueryRunner } from 'typeorm';
import { TransactionInterceptor } from 'src/transactions/transaction.interceptor';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';

@Controller('clinic')
@UseGuards(JwtAuthGuard)
export class ClinicController {
  constructor(private readonly clinicService: ClinicService) {}

  @Post('create')
  @UseInterceptors(TransactionInterceptor)
  async create(
    @Body() createClinicDto: CreateClinicDto,
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
  ) {
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

  @Get('get')
  async findClinicDetails(
    @Query('clinicIds') clinicIdArray: number[],
  ): Promise<Clinic[]> {
    return await this.clinicService.findAllByClinicIds(clinicIdArray);
  }

  @Get('')
  async findOne(@Query('id') id: number) {
    return await this.clinicService.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(TransactionInterceptor)
  async update(
    @Param('id') id: number,
    @Body() updateClinicDto: UpdateClinicDto,
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
  ) {
    try {
      return await this.clinicService.update(id, updateClinicDto, queryRunner);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update appointment. Something went wrong.',
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return await this.clinicService.remove(id);
  }
}
