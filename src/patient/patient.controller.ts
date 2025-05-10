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
  Req,
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
import { Request } from 'src/interfaces/request.interface';
import { UserClinicService } from 'src/user_clinic/user_clinic.service';
import { UserRole } from 'src/user_clinic/entity/user_clinic.entity';
import { AppointmentService } from 'src/appointment/appointment.service';
import { CreateAppointmentDto } from 'src/appointment/dto/create-appointment.dto';
import {
  PaymnetMode,
  VisitType,
} from 'src/appointment/entity/appointment.entity';

@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientController {
  constructor(
    private readonly patientService: PatientService,
    private readonly patientClinicService: PatientClinicService,
    private readonly doctorPatientService: DoctorPatientService,
    private readonly userClinicService: UserClinicService,
    private readonly appointmentService: AppointmentService,
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
      throw error;
    }
  }

  @Post('/register-by-doctor')
  @UseInterceptors(TransactionInterceptor)
  async addNewPatientByDoctor(
    @Body()
    patientData: {
      patient: CreateUserDto;
      metaData: CreateMetaDataDto;
      time: Date;
      visitType: VisitType;
      clinicId: number;
    },
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Req() req: Request,
  ): Promise<any> {
    try {
      const userId = req?.user?.uid;
      const { patient, metaData, visitType, time, clinicId } = patientData;
      const newPatient = await this.patientService.addNewPatientByDoctor(
        patient,
        metaData,
        userId,
        clinicId,
        queryRunner,
      );
      const finalAppointmentData: CreateAppointmentDto = {
        patient: newPatient.uid,
        visitType,
        time,
        isPaid: true,
        paymentMode: PaymnetMode.OFFLINE,
        doctor: userId,
        clinic_id: clinicId,
      };
      const newAppointment = await this.appointmentService.create(
        finalAppointmentData,
        queryRunner,
      );
      return newAppointment;
    } catch (error) {
      throw error;
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
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Req() req: Request,
    @Query('clinicId') clinicId: number,
    @Query('ageMin') ageMin?: number,
    @Query('ageMax') ageMax?: number,
    @Query('sex') sex?: string,
    @Query('appointmentStart') appointmentStart?: string,
    @Query('appointmentEnd') appointmentEnd?: string,
    @Query('search') search?: string,
    @Query('page') pageParam: string = '1',
    @Query('pageSize') pageSizeParam: string = '50',
  ): Promise<{ data: any[]; totalCount: number }> {
    try {
      const userId = req?.user?.uid;

      // Validate clinicId
      if (!clinicId || isNaN(Number(clinicId))) {
        throw new Error('Valid clinic ID is required');
      }

      // Parse pagination parameters to numbers
      const page = parseInt(pageParam, 10) || 1;
      const pageSize = parseInt(pageSizeParam, 10) || 50;
      const userRoles = await this.userClinicService.findUserRolesInClinic(
        queryRunner,
        userId,
        clinicId,
      );
      if (
        userRoles.includes(UserRole.ADMIN) ||
        userRoles.includes(UserRole.RECEPTIONIST)
      ) {
        return await this.patientClinicService.findAllPatientsByClinicIdOfAdmin(
          clinicId,
          ageMin,
          ageMax,
          sex,
          appointmentStart,
          appointmentEnd,
          page,
          pageSize,
          search,
        );
      } else {
        return await this.doctorPatientService.findAllPatientsOfDoctorByClinicId(
          userId,
          clinicId,
          ageMin,
          ageMax,
          sex,
          appointmentStart,
          appointmentEnd,
          page,
          pageSize,
          search,
        );
      }
    } catch (error) {
      throw error;
    }
  }
}
