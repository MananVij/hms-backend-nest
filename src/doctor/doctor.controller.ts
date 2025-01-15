import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { Doctor } from './entity/doctor.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UserClinicService } from 'src/user_clinic/user_clinic.service';
import { CreateUserClinicDto } from 'src/user_clinic/dto/create_user_clinic.dto';
import { ArrayContains, QueryRunner } from 'typeorm';
import { TransactionInterceptor } from 'src/transactions/transaction.interceptor';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';
import { ClinicService } from 'src/clininc/clinic.service';
import { UserRole } from 'src/user_clinic/entity/user_clinic.entity';
import { Request } from 'src/interfaces/request.interface';
import { AddRoleToAdminDto } from './dto/add-role.dto';

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
      throw error;
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
      throw error;
    }
  }

  @Post('add-role')
  @UseInterceptors(TransactionInterceptor)
  async addRoleToStaff(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Req() req: Request,
    @Body('adminData') addRoleToAdminDto: AddRoleToAdminDto,
  ) {
    try {
      const adminId = req?.user?.uid;
      return await this.userClinicService.addRoleToAdmin(
        queryRunner,
        adminId,
        addRoleToAdminDto,
      );
    } catch (error) {
      throw error;
    }
  }

  @Get('')
  async findStaffInClinic(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Req() req: Request,
    @Query('clinicId') clinicId: number,
    @Query('type') type: string,
  ): Promise<any> {
    try {
      const userId = req?.user?.uid;
      var roleCondition = {};
      if (type !== undefined && type === UserRole.DOCTOR) {
        roleCondition = { role: ArrayContains([UserRole.DOCTOR]) };
      }
      const [clinic, staff] = await Promise.all([
        this.clinicService.findOne(clinicId),
        this.userClinicService.findStaffOfClinic(
          queryRunner,
          userId,
          clinicId,
          roleCondition,
        ),
      ]);
      return { clinic, staff };
    } catch (error) {
      throw error;
    }
  }
}
