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
import { addMinutes, endOfDay, startOfDay, subDays } from 'date-fns';
import { ErrorLogService } from 'src/errorlog/error-log.service';
import { MedicalReport } from 'src/medical-reports/entity/medical-reports.entity';
import { PatientClinic } from 'src/patient_clinic/entity/patient_clinic.entity';
import { NotificationService } from 'src/notification/notification.service';
import {
  NotificationSubTypeEnum,
  NotificationTypeEnum,
} from 'src/notification/notification.enum';
import { Report } from 'src/report/report.entity';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    private readonly userService: UserService,
    private readonly userClinicService: UserClinicService,
    private readonly errorLogService: ErrorLogService,
    private readonly notificationService: NotificationService,
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

      const clinicPatientExists = await queryRunner.manager.findOne(
        PatientClinic,
        { where: { patient: { uid: patient }, clinic: { id: clinic_id } } },
      );
      if (!clinicPatientExists) {
        const clinicPatient = queryRunner.manager.create(PatientClinic, {
          patient: patientFound,
          clinic,
        });
        await queryRunner.manager.save(clinicPatient);
      }

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
      if (createAppointmentDto?.followUp) {
        await this.notificationService.createNotification(queryRunner, {
          type: NotificationTypeEnum.WHATSAPP,
          subType: NotificationSubTypeEnum.REMINDER,
          appointmentId: 0,
          isSent: false,
        });
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
          publicIdentifier: savedAppointment.patient.publicIdentifier,
          address: {
            line1: savedAppointment.patient.address?.line1,
            line2: savedAppointment.patient.address?.line2,
            pincode: savedAppointment.patient.address?.pincode,
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

  processAppointments = (appointments: any[]) => {
    return appointments?.map((appointment) => {
      const doctorId = appointment?.doctor?.uid;
      const clinicId = appointment?.clinic?.id;

      // Filter userClinics to get only the matching clinic
      const filteredUserClinic = appointment?.doctor?.userClinics.find(
        (clinic) =>
          clinic?.clinic?.id === clinicId && clinic?.user?.uid === doctorId,
      );

      if (filteredUserClinic) {
        if (filteredUserClinic.usesOwnLetterPad) {
          filteredUserClinic.headerImage = null;
          filteredUserClinic.footerText = null;
        } else {
          filteredUserClinic.padding = {
            paddingTop: 0,
            paddingLeft: 40,
            paddingBottom: 0,
            paddingRight: 40,
          };
        }
      }

      delete filteredUserClinic?.user;
      delete filteredUserClinic?.clinic;
      delete filteredUserClinic?.usesOwnLetterPad;
      delete appointment?.doctor?.userClinics;

      appointment.doctor.letterPadStyle = filteredUserClinic
        ? filteredUserClinic
        : null;

      return appointment;
    });
  };

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
        userClinics: {
          usesOwnLetterPad: true,
          padding: {
            paddingTop: true,
            paddingBottom: true,
            paddingLeft: true,
            paddingRight: true,
          },
          footerText: true,
          headerImage: true,
          user: {
            uid: true,
          },
          clinic: {
            id: true,
          },
        },
      },
      clinic: {
        id: true,
        name: true,
        line1: true,
      },
      id: true,
      time: true,
      isPaid: true,
      visitType: true,
      status: true,
      followUp: true,
    };
    try {
      const [patient, reqUser, clinic, userRole] = await Promise.all([
        this.userService.findUserByUserId(patientId),
        queryRunner.manager.findOne(User, {
          where: { uid: userId },
        }),
        queryRunner.manager.findOne(Clinic, { where: { id: clinicId } }),
        this.userClinicService.findUserRolesInClinic(
          queryRunner,
          userId,
          clinicId,
        ),
      ]);
      if (!patient || !reqUser || !clinic || !userRole) {
        throw new NotFoundException('Credentails not found.');
      }

      if (userRole.length === 1 && userRole?.includes(UserRole.DOCTOR)) {
        let doctorAppointments = await this.appointmentRepository.find({
          where: {
            patient: { uid: patientId },
            doctor: { uid: userId },
          },
          relations: [
            'doctor',
            'prescription',
            'vitals',
            'clinic',
            'doctor.userClinics',
            'doctor.userClinics.clinic',
            'doctor.userClinics.user',
          ],
          select: {
            ...selectCondition,
          },
          order: {
            time: 'DESC',
          },
        });
        doctorAppointments = this.processAppointments(doctorAppointments);
        const medicalReports = await queryRunner.manager.find(MedicalReport, {
          where: { patient, doctor: { user: { uid: userId } } },
          order: { createdAt: 'DESC' },
        });
        return {
          appointments: { doctorAppointments },
          patient,
          medicalReports,
        };
      } else if (userRole?.includes(UserRole.ADMIN)) {
        let doctorAppointments = await queryRunner.manager.find(Appointment, {
          where: {
            doctor: { uid: userId },
            patient: { uid: patientId },
          },
          relations: [
            'doctor',
            'prescription',
            'vitals',
            'clinic',
            'doctor.userClinics',
            'doctor.userClinics.clinic',
            'doctor.userClinics.user',
          ],
          select: {
            ...selectCondition,
          },
          order: {
            time: 'DESC',
          },
        });
        doctorAppointments = this.processAppointments(doctorAppointments);
        let clinicAppointments = await queryRunner.manager.find(Appointment, {
          where: {
            doctor: {
              uid: Not(userId),
            },
            patient: { uid: patientId },
            clinic: { id: clinicId },
          },
          relations: [
            'doctor',
            'prescription',
            'vitals',
            'clinic',
            'doctor.userClinics',
            'doctor.userClinics',
            'doctor.userClinics.clinic',
            'doctor.userClinics.user',
          ],
          select: {
            ...selectCondition,
          },
          order: {
            time: 'DESC',
          },
        });
        clinicAppointments = this.processAppointments(clinicAppointments);
        const [report1, report2] = await Promise.all([
          queryRunner.manager.find(MedicalReport, {
            where: { patient, doctor: { user: { uid: userId } } },
            order: { createdAt: 'DESC' },
          }),
          queryRunner.manager.find(Report, {
            where: { patient, doctor: {user: {uid: userId}}},
            order: { createdAt: 'DESC' },
          }),
        ]);
        const mappedReport2 = report2.map(r => ({
          createdAt: r.createdAt,
          fileUrl: r.pdfUrl,
          recordType: r.template.type,
          comments: r.template.subtype,
        }));
        const medicalReports = [...report1, ...mappedReport2];
        return {
          patient,
          appointments: { doctorAppointments, clinicAppointments },
          medicalReports,
        };
      } else if (userRole?.includes(UserRole.RECEPTIONIST)) {
        let clinicAppointments = await queryRunner.manager.find(Appointment, {
          where: {
            patient: { uid: patientId },
            clinic: { id: clinicId },
          },
          relations: [
            'doctor',
            'prescription',
            'vitals',
            'clinic',
            'doctor.userClinics',
            'doctor.userClinics.clinic',
            'doctor.userClinics.user',
          ],

          select: {
            ...selectCondition,
          },
          order: {
            time: 'DESC',
          },
        });
        clinicAppointments = this.processAppointments(clinicAppointments);
        return {
          patient,
          appointments: { clinicAppointments },
        };
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
    isToday: boolean = false,
  ) {
    const today = addMinutes(new Date(), 5 * 60 + 30); // Adjust to IST

    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    const startOfYesterday = startOfDay(subDays(today, 1));
    try {
      const userRoles = await this.userClinicService.findUserRolesInClinic(
        queryRunner,
        userId,
        clinicId,
      );

      const prescriptionCondition = upcoming
        ? { prescription: IsNull() }
        : { prescription: Not(IsNull()) };

      const timeCondition = isToday
        ? { time: Between(startOfToday, endOfToday) }
        : { time: Between(startOfYesterday, endOfToday) };

      const selectCondition = {
        doctor: {
          name: true,
          phoneNumber: true,
        },
        patient: {
          uid: true,
          name: true,
          phoneNumber: true,
          publicIdentifier: true,
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
      if (
        userRoles.includes(UserRole.ADMIN) ||
        userRoles.includes(UserRole.RECEPTIONIST)
      ) {
        return await this.appointmentRepository.find({
          where: {
            clinic: { id: clinicId },
            ...prescriptionCondition,
            ...timeCondition,
          },
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
            ...timeCondition,
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
