import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Between, DeepPartial, In, QueryRunner, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Appointment } from './entity/appointment.entity';
import { User, UserRole } from 'src/user/entity/user.enitiy';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Clinic } from 'src/clininc/entity/clininc.entity';
import { startOfDay, endOfDay } from 'date-fns';
import { DoctorPatient } from 'src/doctor_patient/entity/doctor_patient.entity';
import { Doctor } from 'src/doctor/entity/doctor.entity';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,

    @InjectRepository(Clinic)
    private clinicRepository: Repository<Clinic>,
  ) {}

  async create(
    createAppointmentDto: CreateAppointmentDto,
    queryRunner: QueryRunner,
  ): Promise<Appointment> {
    const { doctor, patient, clinic_id, ...otherEntites } =
      createAppointmentDto;

    try {
      const [patientFound, doctorFound, clinic] = await Promise.all([
        queryRunner.manager.findOne(User, {
          where: { uid: patient, role: UserRole.PATIENT },
        }),
        queryRunner.manager.findOne(User, {
          where: { uid: doctor, role: UserRole.DOCTOR },
        }),
        queryRunner.manager.findOne(Clinic, {
          where: { id: clinic_id },
        }),
      ]);

      if (!doctorFound || !patientFound || !clinic) {
        throw new NotFoundException('Doctor, patient, or clinic not found');
      }

      const appointment = queryRunner.manager.create(Appointment, {
        doctor: doctorFound,
        patient: patientFound,
        clinic,
        ...otherEntites,
      } as DeepPartial<Appointment>);

      const doctorEntity = await queryRunner.manager.findOne(Doctor, {
        where: { user: { uid: doctor } },
      });

      const doctorPatientExists = await queryRunner.manager.findOne(
        DoctorPatient,
        {
          where: {
            doctor: { user: { uid: doctor } },
            patient: { uid: patient },
          },
        },
      );

      if (!doctorPatientExists) {
        const doctorPatient = queryRunner.manager.create(DoctorPatient, {
          doctor: doctorEntity,
          patient: patientFound,
        });
        await queryRunner.manager.save(doctorPatient);
      }

      return queryRunner.manager.save(appointment);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Something Went Wrong');
    }
  }

  async findAllAppointments(userId: string, role: string): Promise<any> {
    if (role === UserRole.DOCTOR) {
      return await this.appointmentRepository.find({
        where: { doctor: { uid: userId } },
        relations: ['clinic', 'patient'],
        order: { created_at: 'DESC' },
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
        order: { time: 'DESC' },
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
    queryRunner: QueryRunner,
  ): Promise<Appointment> {
    try {
      const appointment = await queryRunner.manager.findOne(Appointment, {
        where: { id },
      });

      if (!appointment) {
        throw new NotFoundException(`Appointment not found`);
      }

      Object.assign(appointment, updateAppointmentDto);
      return queryRunner.manager.save(appointment);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Something went wrong.');
    }
  }
}
