import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  Req,
  Query,
  Get,
  Patch,
} from '@nestjs/common';
import { PrescriptionService } from './prescription.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { Prescription } from './entity/prescription.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { QueryRunner } from 'typeorm';
import { TransactionInterceptor } from 'src/transactions/transaction.interceptor';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';
import { Request } from 'src/interfaces/request.interface';
import { UserClinicService } from 'src/user_clinic/user_clinic.service';

@Controller('prescriptions')
@UseGuards(JwtAuthGuard)
export class PrescriptionController {
  constructor(
    private readonly prescriptionService: PrescriptionService,
    private readonly userClinicService: UserClinicService,
  ) {}

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
      throw error;
    }
  }

  @Get('recent')
  @UseInterceptors(TransactionInterceptor)
  async findRecentPrescriptions(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Req() req: Request,
    @Query('clinicId') clinicId: number,
  ): Promise<any> {
    try {
      const userId = req.user?.uid;
      const role = await this.userClinicService.findUserRolesInClinic(
        queryRunner,
        userId,
        clinicId,
      );
      return await this.prescriptionService.findRecentPrescriptions(
        queryRunner,
        userId,
        clinicId,
        role,
      );
    } catch (error) {
      throw error;
    }
  }

  @Patch('')
  @UseInterceptors(TransactionInterceptor)
  async editRecentPrescription(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Req() req: Request,
    @Query('clinicId') clinicId: number,
    @Query('prescriptionId') prescriptionId: number,
    @Body() updatePrescriptionDto: CreatePrescriptionDto,
  ): Promise<any> {
    try {
      const userId = req.user?.uid;
      return await this.prescriptionService.editPrescription(
        queryRunner,
        prescriptionId,
        updatePrescriptionDto,
        userId,
        clinicId,
      );
    } catch (error) {
      throw error;
    }
  }
}
