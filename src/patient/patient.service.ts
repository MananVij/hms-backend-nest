import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User, UserRole } from 'src/user/entity/user.enitiy';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { DoctorPatient } from 'src/doctor_patient/entity/doctor_patient.entity';
import { DoctorClinic } from 'src/doctor_clinic/entity/doctor_clinic.entity';
import { Appointment } from 'src/appointment/entity/appointment.entity';
import { Prescription } from 'src/prescription/entity/prescription.entity';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { CreateMetaDataDto } from 'src/metadata/dto/create-meta-data.dto';
import { MetaDataService } from 'src/metadata/meta-data.service';
import { ErrorLogService } from 'src/errorlog/error-log.service';

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(DoctorClinic)
    private readonly doctorClinicRepository: Repository<DoctorClinic>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly metaDataService: MetaDataService,

    @InjectRepository(DoctorPatient)
    private readonly doctorPatientRepository: Repository<DoctorPatient>,

    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,

    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,

    @InjectRepository(Prescription)
    private readonly prescriptionRepository: Repository<Prescription>,

    private readonly errorLogService: ErrorLogService,
  ) {}

  async addNewPatientByDoctor(
    createPatientDto: CreateUserDto,
    createMetaDataDto: CreateMetaDataDto,
    doctorId: string,
  ): Promise<any> {
    try {
      const newPatient = this.userRepository.create({
        role: [UserRole.PATIENT],
        ...createPatientDto,
      });
      const patient = await this.userRepository.save(newPatient);
      await this.metaDataService.create({
        ...createMetaDataDto,
        uid: patient.uid,
      });

      const doctor = await this.doctorRepository.findOne({
        where: { user: { uid: doctorId } },
      });
      if (!doctor) {
        throw new Error('Doctor not found');
      }
      const doctorPatient = this.doctorPatientRepository.create({
        doctor,
        patient,
      });
      await this.doctorPatientRepository.save(doctorPatient);
      return { id: patient.uid };
    } catch (error) {
      await this.errorLogService.logError(
        `Error in adding new patient by doctor: ${error.message}`,
        error.stack,
        null,
        null,
        null,
      );
      throw new Error('Something Went Wrong!');
    }
  }

  async findAllPatientsOfDoctor(id: string): Promise<User[]> {
    try {
      const doctorPatients = await this.doctorPatientRepository.find({
        where: { doctor: { user: { uid: id } } },
        relations: ['patient', 'patient.metaData', 'patient.contact']
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

  async findPatientsOfAdmin(id: string): Promise<User[]> {
    try {
      const adminWithClinics = await this.userRepository.findOne({
        where: { uid: id, role: UserRole.ADMIN },
        relations: ['clinics', 'clinics.doctorClinics.doctor'],
      });

      const doctorIds = adminWithClinics.clinics.flatMap((clinic) =>
        clinic.doctorClinics.map((doctorClinic) => {
          doctorClinic.doctor.id;
        }),
      );
      const doctorPatients = await this.doctorPatientRepository.find({
        where: { doctor: { id: In(doctorIds) } },
        relations: ['patient'],
      });

      // Extract unique patient records
      const patients = Array.from(
        new Set(doctorPatients.map((dp) => dp.patient)),
      );
      return patients;
    } catch (error) {
      await this.errorLogService.logError(
        `Error in finding patients of admin: ${error.message}`,
        error.stack,
        null,
        id,
        null,
      );
      throw new Error('Something Went Wrong!');
    }
  }

  async findPatientsByClinic(clinincId: number): Promise<User[]> {
    try {
      const doctorClinics = await this.doctorClinicRepository.find({
        where: { clinic: { id: clinincId } },
        relations: ['doctor'],
      });

      const doctorIds = doctorClinics.map(
        (doctorClinic) => doctorClinic.doctor.id,
      );

      if (doctorIds.length === 0) {
        return [];
      }

      const doctorPatients = await this.doctorPatientRepository.find({
        where: { doctor: { id: In(doctorIds) } },
        relations: ['patient', 'patient.metaData', 'patient.contact'],
      });

      const patients = Array.from(
        new Set(
          await Promise.all(
            doctorPatients.map(async (dp) => {
              const latestAppointment = await this.appointmentRepository
                .createQueryBuilder('appointment')
                .where('appointment.patient = :patientId', {
                  patientId: dp.patient.uid,
                })
                .orderBy('appointment.startTime', 'DESC')
                .select(['appointment.startTime']) // Only fetch the timing field
                .getOne();

              dp.patient['latestAppointmentTiming'] = latestAppointment
                ? latestAppointment.startTime
                : null;

              const latestPrescription = await this.prescriptionRepository
                .createQueryBuilder('prescription')
                .where('prescription.patient = :patientId', {
                  patientId: dp.patient.uid,
                })
                .orderBy('prescription.id', 'DESC') // Order by ID to get the latest entry
                .select(['prescription.diagnosis'])
                .getOne();

              // Add the latest diagnosis to the patient object or set it to 'NaN' if no diagnosis is found
              dp.patient['latestDiagnosis'] = latestPrescription
                ? latestPrescription.diagnosis
                : 'NaN';

              return dp.patient;
            }),
          ),
        ),
      );
      return patients;
    } catch (error) {
      await this.errorLogService.logError(
        `Error in finding patients of clinic: ${error.message}`,
        error.stack,
        null,
        null,
        null,
      );
      throw new Error('Something Went Wrong!');
    }
  }
}
