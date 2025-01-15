import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  ArrayContains,
  Between,
  DeepPartial,
  IsNull,
  Not,
  QueryRunner,
  Repository,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Appointment } from './entity/appointment.entity';
import { User } from 'src/user/entity/user.enitiy';
import { Clinic } from 'src/clininc/entity/clininc.entity';
import { DoctorPatient } from 'src/doctor_patient/entity/doctor_patient.entity';
import { UserService } from 'src/user/user.service';
import { UserRole } from 'src/user_clinic/entity/user_clinic.entity';
import { UserClinicService } from 'src/user_clinic/user_clinic.service';
import { endOfDay, startOfDay } from 'date-fns';
import { ErrorLogService } from 'src/errorlog/error-log.service';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    private readonly userService: UserService,
    private readonly userClinicService: UserClinicService,
    private readonly errorLogService: ErrorLogService,
  ) {}

  async create(
    createAppointmentDto: CreateAppointmentDto,
    queryRunner: QueryRunner,
  ): Promise<any> {
    const { doctor, patient, clinic_id, ...otherEntites } =
      createAppointmentDto;
    const today = new Date();

    try {
      const [patientFound, clinic, doctorFound, existingAppointment] =
        await Promise.all([
          queryRunner.manager.findOne(User, {
            where: { uid: patient, isPatient: true },
          }),

          queryRunner.manager.findOne(Clinic, {
            where: { id: clinic_id },
          }),

          queryRunner.manager.findOne(User, {
            where: {
              uid: doctor,
              userClinics: {
                clinic: { id: clinic_id },
                role: ArrayContains([UserRole.DOCTOR]),
              },
            },
            relations: ['userClinics', 'doctor'],
          }),
          queryRunner.manager.findOne(Appointment, {
            where: {
              patient: { uid: patient },
              doctor: { uid: doctor },
              clinic: { id: clinic_id },
              prescription: IsNull(),
              time: Between(startOfDay(today), endOfDay(today)),
            },
            relations: ['prescription'],
          }),
        ]);

      if (!doctorFound || !patientFound || !clinic) {
        throw new NotFoundException('Doctor, patient, or clinic not found');
      }
      if (existingAppointment) {
        throw new ConflictException(
          'Existing appointment with empty prescription already exists for today.',
        );
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
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      await this.errorLogService.logError(
        `Unable to add appointment: ${error.mesage}`,
        error.stack,
        null,
        doctor,
        patient,
      );
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
        uid: true,
        name: true,
        phoneNumber: true,
      },
      clinic: {
        name: true,
        line1: true,
      },
      id: true,
      time: true,
      isPaid: true,
      visitType: true,
      status: true,
    };
    try {
      const userRoles = await this.userClinicService.findUserRolesInClinic(
        queryRunner,
        userId,
        clinicId,
      );
      const patient = await this.userService.findUserByUserId(patientId);

      if (userRoles?.includes(UserRole.ADMIN)) {
        const appointments = await this.appointmentRepository.find({
          where: [
            {
              patient: {
                uid: patientId,
              },
              doctor: { uid: userId },
            },
            {
              patient: { uid: patientId },
              clinic: { id: clinicId },
              doctor: { uid: Not(userId) },
            },
          ],
          relations: ['doctor', 'prescription', 'vitals', 'clinic'],
          select: {
            ...selectCondition,
          },
        });
        return { appointments, patient };
      } else if (userRoles.includes(UserRole.DOCTOR)) {
        const appointments = await this.appointmentRepository.find({
          where: {
            patient: { uid: patientId },
            doctor: { uid: userId },
          },
          relations: ['doctor', 'prescription', 'vitals', 'clinic'],
          select: {
            ...selectCondition,
          },
          order: {
            time: 'DESC',
          },
        });
        return { appointments, patient };
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      await this.errorLogService.logError(
        `Unable to find appointments of patient, ${error?.message}`,
        error?.stack,
        null,
        userId,
        patientId,
      );
    }
  }

  async findAllAppointments(
    queryRunner: QueryRunner,
    userId: string,
    clinicId: number,
    upcoming: boolean,
  ) {
    try {
      const userRoles = await this.userClinicService.findUserRolesInClinic(
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
      if (userRoles.includes(UserRole.ADMIN)) {
        return await this.appointmentRepository.find({
          where: { clinic: { id: clinicId }, ...prescriptionCondition },
          relations: ['patient', 'doctor', 'vitals', 'clinic'],
          order: {
            time: 'DESC',
          },
          select: {
            ...selectCondition,
          },
        });
      } else if (userRoles.includes(UserRole.DOCTOR)) {
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
      }
    } catch (error) {
      await this.errorLogService.logError(
        `Unable to find all appointments: ${error?.mesage}`,
        error?.stack,
        null,
        userId,
        null,
      );
      throw new InternalServerErrorException(
        'Something went wrong while fetching appointments. Please try again later!',
      );
    }
  }
}
