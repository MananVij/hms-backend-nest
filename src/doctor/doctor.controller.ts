import {
  Controller,
  Get,
  Post,
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
import { UserClinicService } from 'src/user_clinic/user_clinic.service';
import { CreateUserClinicDto } from 'src/user_clinic/dto/create_user_clinic.dto';
import { Equal, Not, QueryRunner } from 'typeorm';
import { TransactionInterceptor } from 'src/transactions/transaction.interceptor';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';
import { ClinicService } from 'src/clininc/clinic.service';
import { UserRole } from 'src/user_clinic/entity/user_clinic.entity';

@Controller('staff')
@UseGuards(JwtAuthGuard)
export class DoctorController {
  constructor(
    private readonly doctorService: DoctorService,
    private readonly userClinicService: UserClinicService,
    private readonly clinicService: ClinicService,
  ) {}

  @Post('create')
  @UseInterceptors(TransactionInterceptor)
  async create(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Body() createDoctorDto: CreateDoctorDto,
  ): Promise<Doctor> {
    try {
      return await this.doctorService.create(createDoctorDto, queryRunner);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Unable to Create Staff. Something Went Wrong.',
      );
    }
  }

  @Post('onboard')
  @UseInterceptors(TransactionInterceptor)
  async onboardExistingDoctor(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Body() createUserClinicDto: CreateUserClinicDto,
  ): Promise<any> {
    try {
      const { userId, clinicId, role } = createUserClinicDto;
      return await this.userClinicService.createUserClinic(queryRunner, {
        userId,
        clinicId,
        role,
      });
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

  @Get('')
  async findStaffInClinic(
    @Query('clinicId') clinicId: number,
    @Query('type') type: string,
  ): Promise<any> {
    try {
      var roleCondition = { role: Not(UserRole.ADMIN) };
      if (type !== undefined && type === UserRole.DOCTOR) {
        roleCondition = { role: Equal(UserRole.DOCTOR) };
      }
      const [clinic, staff] = await Promise.all([
        this.clinicService.findOne(clinicId),
        this.userClinicService.findStaffOfClinic(clinicId, roleCondition),
      ]);
      return { clinic, staff };
    } catch (error) {
      throw error;
    }
  }
}
