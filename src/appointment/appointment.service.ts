import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DeepPartial, IsNull, Not, QueryRunner, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Appointment } from './entity/appointment.entity';
import { User } from 'src/user/entity/user.enitiy';
import { Clinic } from 'src/clininc/entity/clininc.entity';
import { DoctorPatient } from 'src/doctor_patient/entity/doctor_patient.entity';
import { UserService } from 'src/user/user.service';
import { UserRole } from 'src/user_clinic/entity/user_clinic.entity';
import { UserClinicService } from 'src/user_clinic/user_clinic.service';
import { ClinicService } from 'src/clininc/clinic.service';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    private readonly userService: UserService,
    private readonly userClinicService: UserClinicService,
    private readonly clinicService: ClinicService,
  ) {}

  async create(
    createAppointmentDto: CreateAppointmentDto,
    queryRunner: QueryRunner,
  ): Promise<any> {
    const { doctor, patient, clinic_id, ...otherEntites } =
      createAppointmentDto;

    try {
      const [patientFound, clinic, doctorFound] = await Promise.all([
        queryRunner.manager.findOne(User, {
          where: { uid: patient, isPatient: true },
        }),

        queryRunner.manager.findOne(Clinic, {
          where: { id: clinic_id },
        }),

        queryRunner.manager.findOne(User, {
          where: {
            uid: doctor,
            userClinics: { clinic: { id: clinic_id }, role: UserRole.DOCTOR },
          },
          relations: ['userClinics', 'doctor'],
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
          doctor: doctorFound.doctor,
          patient: patientFound,
        });
        await queryRunner.manager.save(doctorPatient);
      }
      const savedAppointment = await queryRunner.manager.save(appointment);
      const formattedData = {
        ...savedAppointment,
        doctor: {
          name: savedAppointment.doctor.name,
          phoneNumber: savedAppointment.doctor.phoneNumber,
        },
        patient: {
          uid: savedAppointment.patient.uid,
          name: savedAppointment.patient.name,
          phoneNumber: savedAppointment.patient.phoneNumber,
          address: {
            line1: savedAppointment.patient.address.line1,
            line2: savedAppointment.patient.address.line2,
            pincode: savedAppointment.patient.address.pincode,
          },
        },
        clinic: {
          id: savedAppointment.clinic.id,
          name: savedAppointment.clinic.name,
          line1: savedAppointment.clinic.line1,
          line2: savedAppointment.clinic.line2,
          pincode: savedAppointment.clinic.pincode,
        },
      };
      return formattedData;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Something Went Wrong');
    }
  }

  async findAppointmentsOfPatient(
    queryRunner: QueryRunner,
    userId: string,
    patientId: string,
    clinicId: number,
  ) {
    const selectCondition = {
      doctor: {
        name: true,
        phoneNumber: true,
      },
    };

    const role = await this.userClinicService.findUserRoleInClinic(
      queryRunner,
      userId,
      clinicId,
    );
    const [patient, clinic] = await Promise.all([
      await this.userService.findUserByUserId(patientId),
      await this.clinicService.findOne(clinicId),
    ]);

    if (role === UserRole.DOCTOR) {
      const appointments = await this.appointmentRepository.find({
        where: {
          patient: { uid: patientId },
          doctor: { uid: userId },
          clinic: { id: clinicId },
        },
        relations: ['doctor', 'prescription', 'vitals'],
        select: {
          ...selectCondition,
        },
      });
      return { appointments, patient, clinic };
    } else if (role === UserRole.ADMIN) {
      const appointments = await this.appointmentRepository.find({
        where: {
          patient: { uid: patientId },
          clinic: { id: clinicId },
        },
        relations: ['doctor', 'prescription', 'vitals'],
        select: {
          ...selectCondition,
        },
      });
      return { appointments, patient, clinic };
    }
  }

  async findAllAppointments(
    queryRunner: QueryRunner,
    userId: string,
    clinicId: number,
    upcoming: boolean,
  ) {
    const role = await this.userClinicService.findUserRoleInClinic(
      queryRunner,
      userId,
      clinicId,
    );

    const prescriptionCondition = upcoming
      ? { prescription: IsNull() }
      : { prescription: Not(IsNull()) };

    const selectCondition = {
      doctor: {
        name: true,
        phoneNumber: true,
      },
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
      clinic: {
        id: true,
        name: true,
        line1: true,
        line2: true,
        pincode: true,
      },
    };

    if (role === UserRole.DOCTOR) {
      return await this.appointmentRepository.find({
        where: {
          clinic: { id: clinicId },
          doctor: { uid: userId },
          ...prescriptionCondition,
        },
        relations: ['patient', 'doctor', 'clinic', 'vitals'],
        select: {
          ...selectCondition,
        },
        order: {
          time: 'DESC',
        },
      });
    } else if (role === UserRole.ADMIN) {
      const hello = this.appointmentRepository.find({
        where: { clinic: { id: clinicId }, ...prescriptionCondition },
        relations: ['patient', 'doctor', 'clinic', 'vitals'],
        order: {
          time: 'DESC',
        },
        select: {
          ...selectCondition,
        },
      });
      console.log(hello);
      return hello;
    }
  }
}
