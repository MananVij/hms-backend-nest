import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
import { PatientClinicService } from 'src/patient_clinic/patient_clinic.service';

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
    private readonly patientClinicService: PatientClinicService,
  ) {}

  async addNewPatientByDoctor(
    createPatientDto: CreateUserDto,
    createMetaDataDto: CreateMetaDataDto,
    doctorId: string,
    clinicId: number,
  ): Promise<any> {
    try {
      const checkPatient = await this.userRepository.findOne({
        where: { phoneNumber: createPatientDto.phoneNumber },
      });
      if (checkPatient) {
        throw new Error('Patient with phone number exists.');
      }

      const doctor = await this.doctorRepository.findOne({
        where: { user: { uid: doctorId } },
      });
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      const newPatient = this.userRepository.create({
        role: [UserRole.PATIENT],
        ...createPatientDto,
      });
      const patient = await this.userRepository.save(newPatient);
      await this.metaDataService.create({
        ...createMetaDataDto,
        uid: patient.uid,
      });

      const doctorPatient = this.doctorPatientRepository.create({
        doctor,
        patient,
      });
      await this.doctorPatientRepository.save(doctorPatient);

      await this.patientClinicService.createPatientClinicRelationship({
        clinicId,
        patientId: patient.uid,
      });
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

  async addDoctorPatientRelationship(doctorId: string, patientId: string) {
    const [doctor, patient] = await Promise.all([
      this.doctorRepository.findOne({ where: { user: { uid: doctorId } } }),
      this.userRepository.findOne({ where: { uid: patientId } }),
    ]);

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const existingRelationship = await this.doctorPatientRepository.findOne({
      where: {
        doctor: { id: doctor.id },
        patient: { uid: patientId },
      },
    });
    if (!existingRelationship) {
      const relationship = this.doctorPatientRepository.create({
        doctor,
        patient,
      });
      return await this.doctorPatientRepository.save(relationship);
    }
    return existingRelationship;
  }
}
