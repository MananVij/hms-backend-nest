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
import { CreateMetaDataDto } from 'src/metadata/dto/create-meta-data.dto';

@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post('/add/:doctorId')
  async addNewPatient(
    @Param('doctorId') doctorId: string,
    @Body()
    patientData: {
      patient: CreateUserDto;
      metaData: CreateMetaDataDto;
    },
  ): Promise<any> {
    const { patient, metaData } = patientData;
    return await this.patientService.addNewPatientByDoctor(
      patient,
      metaData,
      doctorId,
    );
  }

  @Get('doctor/:id')
  async getAllPatientsOfDoctor(@Param('id') id: string): Promise<User[]> {
    const patients = await this.patientService.findAllPatientsOfDoctor(id);
    if (!patients.length) {
      throw new NotFoundException('No patients found for this doctor');
    }
    return patients;
  }


  // Not being Used
  // @Get('admin/:id')
  // async getPatientsOfAdmin(@Param('id') id: string): Promise<User[]> {
  //   const patients = await this.patientService.findPatientsOfAdmin(id);
  //   if (!patients.length) {
  //     throw new NotFoundException('No patients found for this admin');
  //   }
  //   return patients;
  // }

  @Get('clinic/:clinicId')
  async getPatientsByClinic(
    @Param('clinicId') clinicId: number,
  ): Promise<User[]> {
    const patients = await this.patientService.findPatientsByClinic(clinicId);
    if (!patients.length) {
      return []
    }
    return patients;
  }
}
