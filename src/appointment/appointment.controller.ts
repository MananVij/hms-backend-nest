import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Appointment } from './entity/appointment.entity';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post('/create')
  async create(
    @Body() createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    return this.appointmentService.create(createAppointmentDto);
  }

  @Get('all')
  async findAll(
    @Query('userId') userId: string,
    @Query('role') role: string,
  ): Promise<Appointment[]> {
    return this.appointmentService.findAllAppointments(userId, role);
  }

  @Get('')
  async findOne(@Param('id') id: number): Promise<Appointment> {
    return this.appointmentService.findOne(id);
  }

  @Put('')
  async update(
    @Param('id') id: number,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    return this.appointmentService.updateAppointment(id, updateAppointmentDto);
  }

  @Get('today')
  async todayAppointmentDoctor(
    @Query(':id') id: string,
  ): Promise<Appointment[]> {
    return this.appointmentService.getTodayAppointmentsForDoctor(id);
  }
}
