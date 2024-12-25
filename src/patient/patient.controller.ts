import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { User } from 'src/user/entity/user.enitiy';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'; // Import your JWT Auth guard if applicable
import { CreateMetaDataDto } from 'src/metadata/dto/create-meta-data.dto';
import { PatientClinicService } from 'src/patient_clinic/patient_clinic.service';
import { DoctorPatientService } from 'src/doctor_patient/doctor_patient.service';

@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientController {
  constructor(
    private readonly patientService: PatientService,
    private readonly patientClinicService: PatientClinicService,
    private readonly doctorPatientService: DoctorPatientService,
  ) {}

  @Post('/register')
  async addNewPatient(
    @Body()
    patientData: {
      patient: CreateUserDto;
      metaData: CreateMetaDataDto;
      doctorId: string;
      clinicId: number;
    },
  ): Promise<any> {
    const { patient, metaData, doctorId, clinicId } = patientData;
    return await this.patientService.addNewPatientByDoctor(
      patient,
      metaData,
      doctorId,
      clinicId,
    );
  }

  @Post('onboard')
  async addOldPatient(
    @Body()
    data: {
      doctorId: string;
      clinicId: number;
      patientId: string;
    },
  ) {
    const { doctorId, clinicId, patientId } = data;
    const doctorPatientRelationship =
      await this.patientService.addDoctorPatientRelationship(
        doctorId,
        patientId,
      );
    const patientClinicRelationship =
      await this.patientClinicService.createPatientClinicRelationship({
        patientId,
        clinicId,
      });

    return {
      doctorPatientRelationship,
      patientClinicRelationship,
    };
  }

  @Get('all')
  async getAllPatientsByClinic(
    @Query('doctorId') doctorId: string,
    @Query('clinicId') clinicId: number,
  ): Promise<User[]> {
    if (!doctorId) {
      return await this.patientClinicService.findAllPatientsByClinicIdOfAdmin(
        clinicId,
      );
    } else {
      return await this.doctorPatientService.findAllPatientsOfDoctorByClinicId(
        doctorId,
        clinicId,
      );
    }
  }
}
