import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Appointment } from './entity/appointment.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { QueryRunner } from 'typeorm';
import { TransactionInterceptor } from 'src/transactions/transaction.interceptor';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';
import { Request } from 'src/interfaces/request.interface';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TransactionInterceptor)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post('')
  @UseInterceptors(TransactionInterceptor)
  async create(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Body() createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    try {
      return this.appointmentService.create(createAppointmentDto, queryRunner);
    } catch (error) {
      throw error;
    }
  }

  @Get('all')
  async findAll(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Req() req: Request,
    @Query('clinicId') clinicId: number,
    @Query('upcoming') upcoming: string,
  ): Promise<any> {
    try {
      const userId = req?.user?.uid;
      const isUpcoming = upcoming === 'true';
      return this.appointmentService.findAllAppointments(
        queryRunner,
        userId,
        clinicId,
        isUpcoming,
      );
    } catch (error) {
      throw error;
    }
  }

  @Get('')
  async findPatientPrescriptions(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Req() req: Request,
    @Query('patientId') patientId: string,
    @Query('clinicId') clinicId: number,
  ) {
    try {
      const userId = req?.user?.uid;
      return await this.appointmentService.findAppointmentsOfPatient(
        queryRunner,
        userId,
        patientId,
        clinicId,
      );
    } catch (error) {
      throw error;
    }
  }
}
