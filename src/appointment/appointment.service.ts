import { Injectable, NotFoundException } from '@nestjs/common';
import { Between, DeepPartial, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Appointment } from './entity/appointment.entity';
import { User, UserRole } from 'src/user/entity/user.enitiy';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Clinic } from 'src/clininc/entity/clininc.entity';
import { startOfDay, endOfDay, addDays, subDays } from 'date-fns';
import { DoctorPatient } from 'src/doctor_patient/entity/doctor_patient.entity';
import { Doctor } from 'src/doctor/entity/doctor.entity';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,

    @InjectRepository(Clinic)
    private clinicRepository: Repository<Clinic>,

    @InjectRepository(DoctorPatient)
    private doctorPatientRepository: Repository<DoctorPatient>,
  ) {}

  async create(
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const { doctor, patient, clinic_id, ...otherEntites } =
      createAppointmentDto;

    const patientFound = await this.userRepository.findOne({
      where: { uid: patient, role: UserRole.PATIENT },
    });
    const doctorFound = await this.userRepository.findOne({
      where: { uid: doctor, role: UserRole.DOCTOR },
    });
    const clinic = await this.clinicRepository.findOne({
      where: { id: clinic_id },
    });

    if (!doctorFound || !patientFound || !clinic) {
      throw new NotFoundException('Doctor, patient, or clinic not found');
    }

    const appointment = this.appointmentRepository.create({
      doctor: doctorFound,
      patient: patientFound,
      clinic,
      ...otherEntites,
    } as DeepPartial<Appointment>);

    const doctorEntity = await this.doctorRepository.findOne({
      where: { user: { uid: doctor } },
    });

    const doctorPatientExists = await this.doctorPatientRepository.findOne({
      where: { doctor: { user: { uid: doctor } }, patient: { uid: patient } },
    });

    if (!doctorPatientExists) {
      const doctorPatient = this.doctorPatientRepository.create({
        doctor: doctorEntity,
        patient: patientFound,
      });
      await this.doctorPatientRepository.save(doctorPatient);
    }

    return this.appointmentRepository.save(appointment);
  }

  async findAllAppointments(userId: string, role: string): Promise<any> {
    if (role === UserRole.DOCTOR) {
      return await this.appointmentRepository.find({
        where: { doctor: { uid: userId } },
        relations: ['clinic', 'patient'],
        order: {created_at: 'DESC'},
        select: {
          patient: {
            uid: true,
            name: true,
          },
        },
      });
    } else if (role === UserRole.PATIENT) {
      const appointments = await this.appointmentRepository.find({
        where: { patient: { uid: userId } },
        relations: ['doctor', 'clinic'],
        order: {time: 'DESC'}
      });
      return appointments;
    } else if (role === UserRole.ADMIN) {
      const clinics = await this.clinicRepository.find({
        where: { admin: { uid: userId } },
      });

      const clinicIds = clinics.map((clinic) => clinic.id);
      const appointments = await this.appointmentRepository.find({
        where: { clinic: { id: In(clinicIds) } },
        relations: ['clinic', 'patient', 'doctor'],
        select: {
          patient: {
            uid: true,
            name: true,
            phoneNumber: true,
            address: {
              line1: true,
              line2: true,
              pincode: true,
            },
          },
          doctor: {
            name: true,
            phoneNumber: true,
          },
        },
      });
      return appointments;
    }
  }

  async getTodayAppointmentsForDoctor(
    doctorId: string,
  ): Promise<Appointment[]> {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const appointments = await this.appointmentRepository.find({
      where: {
        doctor: { uid: doctorId }, // Replace 'uid' with your doctor's user ID field
        time: Between(todayStart, todayEnd),
      },
      relations: ['clinic_id', 'patient', 'prescription'], // Add relevant relations as needed
    });
    return appointments;
  }

  async findOne(id: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['doctorId', 'clinic', 'patientId', 'prescription'],
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }
    return appointment;
  }

  async updateAppointment(
    id: number,
    updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    Object.assign(appointment, updateAppointmentDto);

    return this.appointmentRepository.save(appointment);
  }
}
