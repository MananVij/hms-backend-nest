import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Appointment } from './entity/appointment.entity';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { QueryRunner } from 'typeorm';
import { TransactionInterceptor } from 'src/transactions/transaction.interceptor';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post('/create')
  @UseInterceptors(TransactionInterceptor)
  async create(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
  ): Promise<Appointment> {
    try {
      return this.appointmentService.create(createAppointmentDto, queryRunner);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to create appointment. Something went wrong.',
      );
    }
  }

  @Get('all')
  async findAll(
    @Query('userId') userId: string,
    @Query('role') role: string,
    @Query('upcoming') upcoming: string
  ): Promise<Appointment[]> {
    const isUpcoming = upcoming === 'true'
    return this.appointmentService.findAllAppointments(userId, role, isUpcoming);
  }

  @Get('')
  async findOne(@Query('id') id: number): Promise<Appointment> {
    return this.appointmentService.findOne(id);
  }

  @Put('')
  @UseInterceptors(TransactionInterceptor)
  async update(
    @Param('id') id: number,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
  ): Promise<Appointment> {
    try {
      return this.appointmentService.updateAppointment(
        id,
        updateAppointmentDto,
        queryRunner,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update appointment. Something went wrong.',
      );
    }
  }

  @Get('today')
  async todayAppointmentDoctor(
    @Query(':id') id: string,
  ): Promise<Appointment[]> {
    return this.appointmentService.getTodayAppointmentsForDoctor(id);
  }
}
