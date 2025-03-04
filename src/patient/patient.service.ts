import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, QueryRunner, Repository } from 'typeorm';
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
import { PatientClinic } from 'src/patient_clinic/entity/patient_clinic.entity';
import { UserClinicService } from 'src/user_clinic/user_clinic.service';
import { UserRole } from 'src/user_clinic/entity/user_clinic.entity';

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
    private readonly userClinicService: UserClinicService,
  ) {}

  async addNewPatientByDoctor(
    createPatientDto: CreateUserDto,
    createMetaDataDto: CreateMetaDataDto,
    doctorId: string,
    clinicId: number,
    queryRunner: QueryRunner,
  ): Promise<any> {
    try {
      const users = await queryRunner.manager.count(User, {
        where: { phoneNumber: createPatientDto.phoneNumber },
      });
      if (users >= 4) {
        throw new ConflictException(
          'A phone number can be linked to a maximum of four users.',
        );
      }

      const doctor = await queryRunner.manager.findOne(Doctor, {
        where: { user: { uid: doctorId } },
      });
      if (!doctor) {
        throw new NotFoundException('Doctor not found');
      }

      const newPatient = queryRunner.manager.create(User, {
        isPatient: true,
        email: null,
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
        uid: patient.uid,
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
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      await this.errorLogService.logError(
        `Error in adding new patient by doctor: ${error.message}`,
        error.stack,
        null,
        null,
        null,
      );
      throw new InternalServerErrorException(
        'Something Went Wrong! Unable to add new patient at the moment. Please try again later.',
      );
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
      throw new InternalServerErrorException('Something Went Wrong!');
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
          where: { uid: patientId, isPatient: true },
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
      await this.errorLogService.logError(
        `Unable to add doctor patient relation: ${error?.message}`,
        error?.stack,
        null,
        doctorId,
        patientId,
      );
      throw new InternalServerErrorException('Something Went Wrong.');
    }
  }

  async findPatientsByPhoneNumber(
    queryRunner: QueryRunner,
    userId: string,
    clinicId: number,
    phoneNumber: string,
  ): Promise<any> {
    try {
      const roles = await this.userClinicService.findUserRolesInClinic(
        queryRunner,
        userId,
        clinicId,
      );
      let associatedPatientIds = [];
      if (roles.length === 1 && roles?.includes(UserRole.DOCTOR)) {
        const doctorPatients = await queryRunner.manager.find(DoctorPatient, {
          where: {
            doctor: { user: { uid: userId } },
            patient: { phoneNumber },
          },
          select: { patient: { uid: true, phoneNumber: true } },
          relations: ['doctor', 'patient'],
        });

        const clinicPatients = await queryRunner.manager.find(PatientClinic, {
          where: {
            clinic: { id: clinicId },
            patient: { phoneNumber },
          },
          relations: ['clinic', 'patient'],
          select: { patient: { uid: true, phoneNumber: true } },
        });

        const doctorPatientSet = new Set(
          doctorPatients.map((dp) => dp.patient.uid),
        );
        const clinicPatientSet = new Set(
          clinicPatients.map((cp) => cp.patient.uid),
        );

        associatedPatientIds = [...doctorPatientSet].filter((uid) =>
          clinicPatientSet.has(uid),
        );
      } else if (
        roles?.includes(UserRole.ADMIN) ||
        roles?.includes(UserRole.RECEPTIONIST)
      ) {
        const clinicPatients = await queryRunner.manager.find(PatientClinic, {
          where: { patient: { phoneNumber }, clinic: { id: clinicId } },
          select: { patient: { uid: true } },
          relations: ['patient', 'clinic'],
        });
        if (clinicPatients.length === 4) {
          throw new InternalServerErrorException(
            "Phone number already linked with 4 patients! Can't associate phone number with more than 4 users.",
          );
        }
        associatedPatientIds = clinicPatients.map((pc) => pc.patient.uid);
      }
      const unassociatedPatients = await queryRunner.manager.find(User, {
        where: {
          phoneNumber,
          uid: Not(In([...associatedPatientIds])),
        },
        relations: ['metaData'],
        select: {
          uid: true,
          name: true,
          publicIdentifier: true,
          phoneNumber: true,
          metaData: {
            dob: true,
            sex: true,
          },
        },
      });
      return unassociatedPatients;
    } catch (error) {
      if (
        error instanceof InternalServerErrorException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      await this.errorLogService.logError(
        `Error while fetching patients by phone number: ${error?.message}`,
        error?.stack,
        null,
        userId,
        phoneNumber,
      );
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
        queryRunner.manager.findOne(User, {
          where: { uid: patientId, isPatient: true },
        }),
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
      await this.errorLogService?.logError(
        `Unable to check for doctor patient relationship: ${error?.message}`,
        error?.stack,
        null,
        doctorId,
        patientId,
      );
      throw new InternalServerErrorException('Something Went Wrong');
    }
  }
}
