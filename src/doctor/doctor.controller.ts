import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Query,
  UseInterceptors,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { Doctor } from './entity/doctor.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { DoctorClinicService } from 'src/doctor_clinic/doctor-clinic.service';
import { CreateDoctorClinicDto } from 'src/doctor_clinic/dto/create-doctor-clinic.dto';
import { QueryRunner } from 'typeorm';
import { TransactionInterceptor } from 'src/transactions/transaction.interceptor';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';

@Controller('doctors')
@UseGuards(JwtAuthGuard)
export class DoctorController {
  constructor(
    private readonly doctorService: DoctorService,
    private readonly doctorClinicService: DoctorClinicService,
  ) {}

  @Post('create')
  @UseInterceptors(TransactionInterceptor)
  async create(
    @Body() createDoctorDto: CreateDoctorDto,
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
  ): Promise<Doctor> {
    try {
      return await this.doctorService.create(createDoctorDto, queryRunner);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Unable to Create Doctor. Something Went Wrong.',
      );
    }
  }

  @Post('onboard')
  @UseInterceptors(TransactionInterceptor)
  async onboardExistingDoctor(
    @Body() createDoctorClinicDto: CreateDoctorClinicDto,
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
  ): Promise<Doctor> {
    try {
      const { doctorId, clinicId } = createDoctorClinicDto;
      return await this.doctorClinicService.create(doctorId, clinicId, queryRunner);
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Unable to Create Doctor. Something Went Wrong.',
      );
    }
  }

  @Get('clinic')
  async findDoctorsInClinic(@Query('id') id: number): Promise<Doctor[]> {
    return await this.doctorService.findDoctorsByClinicId(id);
  }

  @Get(':id')
  async find(@Param('id') id: string): Promise<Doctor> {
    return await this.doctorService.findDoctor(id);
  }
}
