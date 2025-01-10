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
import { Not, QueryRunner } from 'typeorm';
import { TransactionInterceptor } from 'src/transactions/transaction.interceptor';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';
import { ClinicService } from 'src/clininc/clinic.service';
import {
  UserRole,
} from 'src/user_clinic/entity/user_clinic.entity';

@Controller('doctors')
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
      const userClinic = await this.userClinicService.createUserClinic(
        queryRunner,
        {
          userId,
          clinicId,
          role,
        },
      );
      const formattedData = {
        role: userClinic.role,
        user: {
          id: userClinic.user.uid,
          name: userClinic.user.name,
          email: userClinic.user.email,
          phoneNumber: userClinic.user.phoneNumber,
          address: {
            line1: userClinic.user.address.line1,
            line2: userClinic.user.address.line2,
            pincode: userClinic.user.address.pincode,
          },
          doctor: {
            id: userClinic.user.doctor.id,
            fee: userClinic.user.doctor.fee,
            licenseNumber: userClinic.user.doctor.licenseNumber,
            qualification: userClinic.user.doctor.qualification,
            specialization: userClinic.user.doctor.specialization,
          },
        },
      };
      return formattedData;
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
  async findStaffInClinic(@Query('id') clinicId: number): Promise<any> {
    try {
      const [clinic, staff] = await Promise.all([
        this.clinicService.findOne(clinicId),
        this.userClinicService.findStaffOfClinic(clinicId, {
          role: Not(UserRole.ADMIN),
        }),
      ]);
      return { clinic, staff };
    } catch (error) {
      throw error
    }
  }
}
