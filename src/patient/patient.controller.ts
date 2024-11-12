import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { User } from 'src/user/entity/user.enitiy';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'; // Import your JWT Auth guard if applicable

@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post(':doctorId')
  @UseGuards(JwtAuthGuard) // Protect this route if necessary
  async addNewPatient(
    @Param('doctorId') doctorId: string,
    @Body() createPatientDto: CreateUserDto,
  ): Promise<User> {
    return this.patientService.addNewPatientByDoctor(
      createPatientDto,
      doctorId,
    );
  }

  @Get('doctor/:id')
  @UseGuards(JwtAuthGuard) // Protect this route if necessary
  async getAllPatientsOfDoctor(@Param('id') id: string): Promise<User[]> {
    const patients = await this.patientService.findAllPatientsOfDoctor(id);
    if (!patients.length) {
      throw new NotFoundException('No patients found for this doctor');
    }
    return patients;
  }

  @Get('admin/:id')
  // @UseGuards(JwtAuthGuard) // Protect this route if necessary
  async getPatientsOfAdmin(@Param('id') id: string): Promise<User[]> {
    const patients = await this.patientService.findPatientsByClinic(2);
    // const patients = await this.patientService.findPatientsOfAdmin(id);
    if (!patients.length) {
      throw new NotFoundException('No patients found for this admin');
    }
    return patients;
  }

  @Get('clinic/:clinicId')
  @UseGuards(JwtAuthGuard) // Protect this route if necessary
  async getPatientsByClinic(
    @Param('clinicId') clinicId: number,
  ): Promise<User[]> {
    const patients = await this.patientService.findPatientsByClinic(clinicId);
    if (!patients.length) {
      throw new NotFoundException('No patients found for this clinic');
    }
    return patients;
  }
}
