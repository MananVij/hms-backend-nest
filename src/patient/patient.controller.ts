import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Query,
  UseInterceptors,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { User } from 'src/user/entity/user.enitiy';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'; // Import your JWT Auth guard if applicable
import { CreateMetaDataDto } from 'src/metadata/dto/create-meta-data.dto';
import { PatientClinicService } from 'src/patient_clinic/patient_clinic.service';
import { DoctorPatientService } from 'src/doctor_patient/doctor_patient.service';
import { QueryRunner } from 'typeorm';
import { TransactionInterceptor } from 'src/transactions/transaction.interceptor';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';

@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientController {
  constructor(
    private readonly patientService: PatientService,
    private readonly patientClinicService: PatientClinicService,
    private readonly doctorPatientService: DoctorPatientService,
  ) {}

  @Post('/register')
  @UseInterceptors(TransactionInterceptor)
  async addNewPatient(
    @Body()
    patientData: {
      patient: CreateUserDto;
      metaData: CreateMetaDataDto;
      doctorId: string;
      clinicId: number;
    },
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
  ): Promise<any> {
    try {
      const { patient, metaData, doctorId, clinicId } = patientData;
      return await this.patientService.addNewPatientByDoctor(
        patient,
        metaData,
        doctorId,
        clinicId,
        queryRunner,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Unable to register patient. Something went wrong.',
      );
    }
  }

  @Post('onboard')
  @UseInterceptors(TransactionInterceptor)
  async addOldPatient(
    @Body()
    data: {
      doctorId: string;
      clinicId: number;
      patientId: string;
    },
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
  ): Promise<any> {
    try {
      const { doctorId, clinicId, patientId } = data;

      const [doctorPatientRelationship, patientClinicRelationship] =
        await Promise.all([
          this.patientService.checkDoctorPatientRelationship(
            doctorId,
            patientId,
            queryRunner,
          ),
          this.patientClinicService.checkPatientClinicRelationship(
            patientId,
            clinicId,
            queryRunner,
          ),
        ]);
      if (doctorPatientRelationship && patientClinicRelationship) {
        throw new ConflictException(
          'Patient already linked to doctor and selected clinic.',
        );
      }

      const createdDoctorPatientRelationship =
        doctorPatientRelationship ??
        (await this.patientService.addDoctorPatientRelationship(
          doctorId,
          patientId,
          queryRunner,
        ));

      const createdPatientClinicRelationship =
        patientClinicRelationship ??
        (await this.patientClinicService.createPatientClinicRelationship(
          { patientId, clinicId },
          queryRunner,
        ));

      return {
        message: 'Patient successfully onboarded.',
        patient:
          createdDoctorPatientRelationship.patient ||
          createdPatientClinicRelationship.patient,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Unable to onboard patient. Something went wrong.',
      );
    }
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
