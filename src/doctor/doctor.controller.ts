import { Controller, Get, Post, Param, Delete, Body } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { Doctor } from './entity/doctor.entity';

@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post()
  async create(@Body() createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    return this.doctorService.create(createDoctorDto);
  }

  @Get()
  async findAll(): Promise<Doctor[]> {
    return this.doctorService.findAll();
  }

  @Get('admin/:id')
  async findDoctorOfAdmin(@Param('id') id: string): Promise<Doctor[]> {
    return this.doctorService.findByAdminId(id)
  }

  @Get('clinic/:id')
  async findDoctorsInClinic(@Param('id') id: number): Promise<Doctor[]> {
    return this.doctorService.findDoctorsByClinicId(id)
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