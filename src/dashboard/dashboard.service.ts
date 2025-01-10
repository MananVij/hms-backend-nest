import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, IsNull, QueryRunner, Repository } from 'typeorm';
import { DoctorPatient } from 'src/doctor_patient/entity/doctor_patient.entity';
import { addDays, endOfDay, startOfDay, subDays } from 'date-fns';
import {
  UserClinic,
  UserRole,
} from 'src/user_clinic/entity/user_clinic.entity';
import { Appointment } from 'src/appointment/entity/appointment.entity';
import { Clinic } from 'src/clininc/entity/clininc.entity';
import { AppointmentService } from 'src/appointment/appointment.service';
import { UserClinicService } from 'src/user_clinic/user_clinic.service';
import { PatientClinic } from 'src/patient_clinic/entity/patient_clinic.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(DoctorPatient)
    private readonly doctorPatientRepository: Repository<DoctorPatient>,

    // @InjectRepository(PatientClinic)
    // private readonly patientClinicRepository: Repository<PatientClinic>,

    @InjectRepository(UserClinic)
    private readonly userClinicRepository: Repository<UserClinic>,

    @InjectRepository(PatientClinic)
    private readonly patientClinicRepository: Repository<PatientClinic>,

    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,

    @InjectRepository(Clinic)
    private readonly clinicRepository: Repository<Clinic>,

    private readonly appointmentService: AppointmentService,

    private readonly userClinicService: UserClinicService,
  ) {}

  async getDashboard(
    queryRunner: QueryRunner,
    userId: string,
    clinicId: number,
  ): Promise<any> {
    const today = new Date();
    const dates = [];
    for (let i = 14; i >= 0; i--) {
      dates.push(addDays(today, -i));
    }
    const countByDate = dates.reduce((acc, date) => {
      const formattedDate = date.toISOString().split('T')[0];
      acc[formattedDate] = 0;
      return acc;
    }, {});
    try {
      const role = await this.userClinicService.findUserRoleInClinic(
        queryRunner,
        userId,
        clinicId,
      );

      const newPatinetTrend = await this.findNewPatientTrend(
        userId,
        clinicId,
        role,
        dates,
        { ...countByDate },
      );

      const appointmentTrend = await this.findAppointmentTrend(
        userId,
        clinicId,
        role,
        dates,
        { ...countByDate },
        today,
      );

      const todayAppointmentArray =
        await this.appointmentService.findAllAppointments(
          queryRunner,
          userId,
          clinicId,
          true,
        );

      const appointmentCountTrend = await this.appointmentComparisonTrend(
        userId,
        role,
      );
      return {
        newPatinetTrend,
        appointmentCountTrend,
        todayAppointmentArray,
        appointmentTrend,
      };
    } catch (error) {
      return error;
    }
  }

  private async findNewPatientTrend(
    userId: string,
    clinicId: number,
    role: string,
    dates: Date[],
    patientCountByDate: { [key: string]: number },
  ) {
    const today = new Date();
    var patients = [];
    if (role === UserRole.DOCTOR) {
      patients = await this.doctorPatientRepository.find({
        where: {
          doctor: { user: { uid: userId } },
          created_at: Between(startOfDay(subDays(today, 14)), endOfDay(today)),
        },
      });
    } else if (role === UserRole.ADMIN) {
      patients = await this.patientClinicRepository.find({
        where: {
          clinic: { id: clinicId },
          created_at: Between(startOfDay(subDays(today, 14)), endOfDay(today)),
        },
      });
    }
    patients.forEach((patient) => {
      const patientDate = patient.created_at.toISOString().split('T')[0];
      if (patientCountByDate[patientDate] !== undefined) {
        patientCountByDate[patientDate]++;
      }
    });

    const patientTrend = dates.map((date) => {
      const formattedDate = date.toISOString().split('T')[0];
      return {
        date: formattedDate,
        count: patientCountByDate[formattedDate],
      };
    });
    return patientTrend;
  }
  private async findAppointmentTrend(
    userId: string,
    clinicId: number,
    role: string,
    dates: Date[],
    appointmentCountByDate: { [key: string]: number },
    today: Date,
  ) {
    var appointments = [];
    try {
      if (role === UserRole.DOCTOR) {
        appointments = await this.appointmentRepository.find({
          where: {
            time: Between(startOfDay(subDays(today, 14)), endOfDay(today)),
            doctor: { uid: userId },
            clinic: { id: clinicId },
          },
          select: { time: true },
        });
      } else if (role === UserRole.ADMIN) {
        appointments = await this.appointmentRepository.find({
          where: {
            time: Between(startOfDay(subDays(today, 14)), endOfDay(today)),
            clinic: { id: clinicId },
          },
          select: {
            time: true,
          },
        });
      }
      appointments.forEach((appointment) => {
        const appointmentDate = appointment.time.toISOString().split('T')[0];
        if (appointmentCountByDate[appointmentDate] !== undefined) {
          appointmentCountByDate[appointmentDate]++;
        }
      });

      const appointmentTrend = dates.map((date) => {
        const formattedDate = date.toISOString().split('T')[0];
        return {
          date: formattedDate,
          count: appointmentCountByDate[formattedDate],
        };
      });
      return appointmentTrend;
    } catch (error) {
      // await this.errorLogService.logError(
      //   error.message,
      //   error.stack,
      //   userId,
      //   null,
      //   null,
      // );
      throw new Error('Something Went Wrong');
    }
  }

  private async appointmentComparisonTrend(userId: string, role: string) {
    const today = new Date();
    let seenAppointments = 0;
    let allAppointments = 0;
    if (role === UserRole.DOCTOR) {
      allAppointments = await this.appointmentRepository.count({
        where: {
          doctor: { uid: userId },
          time: Between(startOfDay(today), endOfDay(today)),
        },
      });

      seenAppointments = await this.appointmentRepository.count({
        where: {
          doctor: { uid: userId },
          prescription: IsNull(),
          time: Between(startOfDay(today), endOfDay(today)),
        },
      });
    } else if (role === UserRole.ADMIN) {
      const adminDoctorIds = [];
      // const adminDoctorIds = await this.userClinicRepository.find({
      //   // where: { clinic: { admin: { uid: userId } } },
      //   relations: ['doctor', 'doctor.user'],
      //   select: {
      //     user: {
      //       uid: true,
      //       user: {
      //         uid: true,
      //       },
      //     },
      //   },
      // });
      const doctorIds = adminDoctorIds.map((doctor) => doctor.doctor.user.uid);
      allAppointments = await this.appointmentRepository.count({
        where: {
          doctor: { uid: In(doctorIds) },
          time: Between(startOfDay(today), endOfDay(today)),
        },
      });
      seenAppointments = await this.appointmentRepository.count({
        where: {
          doctor: { uid: In(doctorIds) },
          prescription: IsNull(),
          time: Between(startOfDay(today), endOfDay(today)),
        },
      });
    }
    return { allAppointments, seenAppointments };
  }
}
