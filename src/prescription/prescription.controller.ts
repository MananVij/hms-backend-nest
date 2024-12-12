import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { PrescriptionService } from './prescription.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { Prescription } from './entity/prescription.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('prescriptions')
@UseGuards(JwtAuthGuard)
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Post('create')
  async create(
    @Body() createPrescriptionDto: CreatePrescriptionDto,
  ): Promise<any> {
    return this.prescriptionService.create(createPrescriptionDto);
  }

  @Get('doctor')
  async findPrescriptionsByDoctor(
    @Param('id') id: string,
  ): Promise<Prescription[]> {
    return this.prescriptionService.findPrescriptionsByDoctor(id);
  }

  // Get prescriptions by patient ID
  @Get('patient/:id')
  async findPrescriptionsByPatient(
    @Param('id') id: string,
  ): Promise<Prescription[]> {
    return this.prescriptionService.findPrescriptionsOfPatient(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Prescription> {
    return this.prescriptionService.findOne(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return this.prescriptionService.remove(id);
  }
}
