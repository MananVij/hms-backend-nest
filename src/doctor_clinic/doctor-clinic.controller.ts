import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { DoctorClinicService } from './doctor-clinic.service';
import { DoctorClinic } from './entity/doctor_clinic.entity';
import { CreateDoctorClinicDto } from './dto/create-doctor-clinic.dto';

@Controller('doctor-clinic')
export class DoctorClinicController {
  constructor(private readonly doctorClinicService: DoctorClinicService) {}

  @Post()
  async create(@Body() createDoctorClinicDto: CreateDoctorClinicDto): Promise<DoctorClinic> {
    return this.doctorClinicService.create(createDoctorClinicDto);
  }

  @Get()
  async findAll(): Promise<DoctorClinic[]> {
    return this.doctorClinicService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<DoctorClinic> {
    return this.doctorClinicService.findOne(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<void> {
    // return this.doctorClinicService.delete(id);
  }
}
