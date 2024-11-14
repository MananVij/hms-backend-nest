import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DoctorClinic } from '../doctor_clinic/entity/doctor_clinic.entity';
import { User, UserRole } from '../user/entity/user.enitiy';
import { DoctorPatient } from '../doctor_patient/entity/doctor_patient.entity';
import { Appointment } from '../appointment/entity/appointment.entity';
import { Prescription } from '../prescription/entity/prescription.entity';
import { CreateUserDto } from '../user/dto/create-user.dto';

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(DoctorClinic)
    private readonly doctorClinicRepository: Repository<DoctorClinic>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(DoctorPatient)
    private readonly doctorPatientRepository: Repository<DoctorPatient>,

    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,

    @InjectRepository(Prescription)
    private readonly prescriptionRepository: Repository<Prescription>,
  ) {}

  async addNewPatientByDoctor(
    createPatientDto: CreateUserDto,
    doctorId: string,
  ): Promise<User> {
    const newPatient = await this.userRepository.create({
      role: [UserRole.PATIENT],
      ...createPatientDto,
    });
    this.userRepository.save(newPatient);
    const doctorPatient = await this.doctorPatientRepository.create({
      doctor: { user: { uid: doctorId } },
      patient: { uid: newPatient.uid },
    });
    this.doctorPatientRepository.save(doctorPatient);

    return newPatient;
  }

  async findAllPatientsOfDoctor(id: string): Promise<User[]> {
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
  }

  async findPatientsOfAdmin(id: string): Promise<User[]> {
    const adminWithClinics = await this.userRepository.findOne({
      where: { uid: id, role: UserRole.ADMIN },
      relations: ['clinics', 'clinics.doctorClinics.doctor'],
    });

    const doctorIds = adminWithClinics.clinics.flatMap((clinic) =>
      clinic.doctorClinics.map((doctorClinic) => {
        console.log(doctorClinic);
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
  }

  async findPatientsByClinic(clinincId: number): Promise<User[]> {
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
  }
}
