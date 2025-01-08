import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, IsNull, Repository } from 'typeorm';
import { UserRole } from 'src/user/entity/user.enitiy';
import { DoctorPatient } from 'src/doctor_patient/entity/doctor_patient.entity';
import { addDays, endOfDay, startOfDay, subDays } from 'date-fns';
import { DoctorClinic } from 'src/doctor_clinic/entity/doctor_clinic.entity';
import { Appointment } from 'src/appointment/entity/appointment.entity';
import { Clinic } from 'src/clininc/entity/clininc.entity';
import { AppointmentService } from 'src/appointment/appointment.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(DoctorPatient)
    private doctorPatientRepository: Repository<DoctorPatient>,

    @InjectRepository(DoctorClinic)
    private doctorClinicRepository: Repository<DoctorClinic>,

    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,

    @InjectRepository(Clinic)
    private clinicRepository: Repository<Clinic>,

    private appointmentService: AppointmentService,
  ) {}

  async getDashboard(userId: string, role: string): Promise<any> {
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
      const newPatinetTrend = await this.findNewPatientTrend(
        userId,
        role,
        dates,
        { ...countByDate },
        today,
      );
      const appointmentTrend = await this.findAppointmentTrend(
        userId,
        role,
        dates,
        { ...countByDate },
        today,
      );
      const todayAppointmentArray =
        await this.appointmentService.findAllAppointments(userId, role, true, {
          time: Between(startOfDay(today), endOfDay(today)),
        });
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
    role: string,
    dates: Date[],
    patientCountByDate: { [key: string]: number },
    today: Date,
  ) {
    var patients = [];
    try {
      if (role === UserRole.DOCTOR) {
        patients = await this.doctorPatientRepository.find({
          where: {
            created_at: Between(
              startOfDay(subDays(today, 14)),
              endOfDay(today),
            ),
            doctor: { user: { uid: userId, role: UserRole.DOCTOR } },
          },

          select: {
            id: true,
            created_at: true,
          },
        });
      } else if (role === UserRole.ADMIN) {
        const adminDoctorIds = await this.doctorClinicRepository.find({
          where: { clinic: { admin: { uid: userId, role: UserRole.ADMIN } } },
          relations: ['doctor'],
          select: {
            doctor: {
              id: true,
            },
          },
        });
        const doctorIds = adminDoctorIds.map((doctor) => doctor.doctor.id);
        patients = await this.doctorPatientRepository.find({
          where: {
            doctor: { id: In(doctorIds) },
            created_at: Between(
              startOfDay(subDays(today, 14)),
              endOfDay(today),
            ),
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
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Something Went Wrong');
    }
  }

  private async findAppointmentTrend(
    userId: string,
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
          },
          select: { time: true },
        });
      } else if (role === UserRole.ADMIN) {
        const adminClinics = await this.clinicRepository.find({
          where: { admin: { uid: userId } },
          select: {
            id: true,
          },
        });
        const clinicIds = adminClinics.map((clinic) => clinic.id);
        appointments = await this.appointmentRepository.find({
          where: {
            time: Between(startOfDay(subDays(today, 14)), endOfDay(today)),
            clinic: { id: In(clinicIds) },
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
      const adminDoctorIds = await this.doctorClinicRepository.find({
        where: { clinic: { admin: { uid: userId } } },
        relations: ['doctor', 'doctor.user'],
        select: {
          doctor: {
            id: true,
            user: {
              uid: true,
            },
          },
        },
      });
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
