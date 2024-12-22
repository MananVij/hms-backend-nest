import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ClinicService } from './clinic.service';
import { CreateClinicDto } from './dto/add-clinic.dto';
import { Clinic } from './entity/clininc.entity';
import { UpdateClinicDto } from './dto/update-clininc.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('clinic')
@UseGuards(JwtAuthGuard)
export class ClinicController {
  constructor(private readonly clinicService: ClinicService) {}

  @Post('create')
  create(@Body() createClinicDto: CreateClinicDto) {
    return this.clinicService.create(createClinicDto);
  }

  @Get()
  findAll() {
    return this.clinicService.findAll();
  }

  @Get('admin/:id') // Gets clinics associated with a specific admin
  async getClinicsByAdmin(@Param('id') adminId: string): Promise<Clinic[]> {
    return this.clinicService.findAllClinicsOfAdmin(adminId);
  }

  @Get('doctor/:id') // Gets clinics associated with a specific doctor
  async getClinicsByDoctor(@Param('id') doctorId: string): Promise<Clinic[]> {
    return this.clinicService.findAllClinicsOfDoctor(doctorId);
  }

  @Get(':id') // Gets a specific clinic by ID
  findOne(@Param('id') id: number) {
    return this.clinicService.findOne(id);
  }

  @Put(':id') // Updates a specific clinic by ID
  update(@Param('id') id: number, @Body() updateClinicDto: UpdateClinicDto) {
    return this.clinicService.update(id, updateClinicDto);
  }

  @Delete(':id') // Deletes a specific clinic by ID
  remove(@Param('id') id: number) {
    return this.clinicService.remove(id);
  }
}
