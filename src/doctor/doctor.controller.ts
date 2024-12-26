import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { Doctor } from './entity/doctor.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { DoctorClinicService } from 'src/doctor_clinic/doctor-clinic.service';
import { DoctorClinic } from 'src/doctor_clinic/entity/doctor_clinic.entity';
import { CreateDoctorClinicDto } from 'src/doctor_clinic/dto/create-doctor-clinic.dto';

@Controller('doctors')
@UseGuards(JwtAuthGuard)
export class DoctorController {
  constructor(
    private readonly doctorService: DoctorService,
    private readonly doctorClinicService: DoctorClinicService,
  ) {}

  @Post('create')
  async create(@Body() createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    return this.doctorService.create(createDoctorDto);
  }

  @Post('onboard')
  async onboardExistingDoctor(
    @Body() createDoctorClinicDto: CreateDoctorClinicDto,
  ): Promise<DoctorClinic> {
    const { doctorId, clinicId } = createDoctorClinicDto;
    return this.doctorClinicService.create(doctorId, clinicId);
  }

  @Get()
  async findAll(): Promise<Doctor[]> {
    return this.doctorService.findAll();
  }

  @Get('clinic')
  async findDoctorsInClinic(@Query('id') id: number): Promise<Doctor[]> {
    return this.doctorService.findDoctorsByClinicId(id);
  }

  @Get(':id')
  async find(@Param('id') id: string): Promise<Doctor> {
    return this.doctorService.findDoctor(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<void> {
    return this.doctorService.delete(id);
  }
}
