import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { User } from 'src/user/entity/user.enitiy';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { DoctorPatient } from 'src/doctor_patient/entity/doctor_patient.entity';
import { Appointment } from 'src/appointment/entity/appointment.entity';
import { Prescription } from 'src/prescription/entity/prescription.entity';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { CreateMetaDataDto } from 'src/metadata/dto/create-meta-data.dto';
import { MetaDataService } from 'src/metadata/meta-data.service';
import { ErrorLogService } from 'src/errorlog/error-log.service';
import { PatientClinicService } from 'src/patient_clinic/patient_clinic.service';

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(DoctorPatient)
    private readonly doctorPatientRepository: Repository<DoctorPatient>,

    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,

    @InjectRepository(Prescription)
    private readonly prescriptionRepository: Repository<Prescription>,

    private readonly metaDataService: MetaDataService,
    private readonly errorLogService: ErrorLogService,
    private readonly patientClinicService: PatientClinicService,
  ) {}

  async addNewPatientByDoctor(
    createPatientDto: CreateUserDto,
    createMetaDataDto: CreateMetaDataDto,
    doctorId: string,
    clinicId: number,
    queryRunner: QueryRunner,
  ): Promise<any> {
    try {
      const checkPatient = await queryRunner.manager.findOne(User, {
        where: { phoneNumber: createPatientDto.phoneNumber },
      });
      if (checkPatient) {
        throw new ConflictException('User with phone number exists.');
      }

      const doctor = await queryRunner.manager.findOne(Doctor, {
        where: { user: { uid: doctorId } },
      });
      if (!doctor) {
        throw new NotFoundException('Doctor not found');
      }

      const newPatient = queryRunner.manager.create(User, {
        isPatient: true,
        ...createPatientDto,
      });
      const patient = await queryRunner.manager.save(newPatient);
      const metaData = await this.metaDataService.create(
        {
          ...createMetaDataDto,
          uid: patient.uid,
        },
        queryRunner,
      );

      const doctorPatient = queryRunner.manager.create(DoctorPatient, {
        doctor,
        patient,
      });
      await queryRunner.manager.save(doctorPatient);

      await this.patientClinicService.createPatientClinicRelationship(
        {
          clinicId,
          patientId: patient.uid,
        },
        queryRunner,
      );
      return {
        id: patient.uid,
        name: patient.name,
        phoneNumber: patient.phoneNumber,
        address: patient.address,
        metaData: {
          dob: metaData.dob,
          sex: metaData.sex,
          height: metaData.height,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      await this.errorLogService.logError(
        `Error in adding new patient by doctor: ${error.message}`,
        error.stack,
        null,
        null,
        null,
      );
      throw new InternalServerErrorException('Something Went Wrong!');
    }
  }

  async findAllPatientsOfDoctor(id: string): Promise<User[]> {
    try {
      const doctorPatients = await this.doctorPatientRepository.find({
        where: { doctor: { user: { uid: id } } },
        relations: ['patient', 'patient.metaData', 'patient.contact'],
      });

      const patients = await Promise.all(
        doctorPatients.map(async (doctorPatient) => {
          const patient = doctorPatient.patient;

          // Fetch the latest appointment timing for this patient
          const latestAppointment = await this.appointmentRepository
            .createQueryBuilder('appointment')
            .where('appointment.patient = :patientId', {
              patientId: patient.uid,
            })
            .orderBy('appointment.startTime', 'DESC')
            .select(['appointment.startTime']) // Only fetch the timing field
            .getOne();

          // Add the latest appointment timing to the patient object
          patient['latestAppointmentTiming'] = latestAppointment
            ? latestAppointment.startTime
            : null;

          // Fetch the latest prescription diagnosis for this patient
          const latestPrescription = await this.prescriptionRepository
            .createQueryBuilder('prescription')
            .where('prescription.patient = :patientId', {
              patientId: patient.uid,
            })
            .orderBy('prescription.id', 'DESC') // Order by ID to get the latest entry
            .select(['prescription.diagnosis'])
            .getOne();

          // Add the latest diagnosis to the patient object or set it to 'NaN' if no diagnosis is found
          patient['latestDiagnosis'] = latestPrescription
            ? latestPrescription.diagnosis
            : 'NaN';

          return patient;
        }),
      );
      return patients;
    } catch (error) {
      await this.errorLogService.logError(
        `Error in finding patients of doctor: ${error.message}`,
        error.stack,
        null,
        id,
        null,
      );
      throw new Error('Something Went Wrong!');
    }
  }

  async addDoctorPatientRelationship(
    doctorId: string,
    patientId: string,
    queryRunner: QueryRunner,
  ) {
    try {
      const [doctor, patient] = await Promise.all([
        queryRunner.manager.findOne(Doctor, {
          where: { user: { uid: doctorId } },
        }),
        queryRunner.manager.findOne(User, {
          where: {uid: patientId, isPatient: true},
          relations: ['metaData'],
          select: {
            uid: true,
            name: true,
            phoneNumber: true,
            metaData: {
              dob: true,
              sex: true,
            },
            address: {
              line1: true,
              line2: true,
            },
          },
        }),
      ]);
      
      const relationship = queryRunner.manager.create(DoctorPatient, {
        doctor,
        patient,
      });
      return await queryRunner.manager.save(relationship);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Something Went Wrong.');
    }
  }

  async checkDoctorPatientRelationship(
    doctorId: string,
    patientId: string,
    queryRunner: QueryRunner,
  ) {
    try {
      const [doctor, patient] = await Promise.all([
        queryRunner.manager.findOne(Doctor, {
          where: { user: { uid: doctorId } },
        }),
        queryRunner.manager.findOne(User, { where: { uid: patientId, isPatient: true } }),
      ]);

      if (!doctor) {
        throw new NotFoundException('Doctor not found');
      }
      if (!patient) {
        throw new NotFoundException('Patient not found');
      }

      const existingRelationship = await queryRunner.manager.findOne(
        DoctorPatient,
        {
          where: {
            doctor: { id: doctor.id },
            patient: { uid: patientId },
          },
        },
      );
      return existingRelationship;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Something Went Wrong');
    }
  }
}
