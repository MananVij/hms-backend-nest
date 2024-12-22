import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { UserRole } from 'src/user/entity/user.enitiy';
import { DoctorPatient } from 'src/doctor_patient/entity/doctor_patient.entity';
import { addDays, endOfDay, startOfDay, subDays } from 'date-fns';
import { DoctorClinic } from 'src/doctor_clinic/entity/doctor_clinic.entity';
import { Appointment } from 'src/appointment/entity/appointment.entity';
import { Clinic } from 'src/clininc/entity/clininc.entity';

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
        countByDate,
        today,
      );

      const appointmentData = await this.findAppointmentTrend(
        userId,
        role,
        dates,
        countByDate,
        today,
      );
      const appointmentCountTrend = await this.appointmentComparisonTrend(
        userId,
        role,
      );
      return { newPatinetTrend, appointmentCountTrend, ...appointmentData };
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
            doctor: { user: { uid: userId } },
          },

          select: {
            id: true,
            created_at: true,
          },
        });
      } else if (role === UserRole.ADMIN) {
        const adminDoctorIds = await this.doctorClinicRepository.find({
          where: { clinic: { admin: { uid: userId } } },
          select: {
            doctor: {
              id: true,
            },
          },
        });
        const doctorIds = adminDoctorIds.map((doctor) => doctor.id);
        patients = await this.doctorPatientRepository.find({
          where: {
            doctor: In(doctorIds),
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
    var todayAppointmentArray = [];
    try {
      if (role === UserRole.DOCTOR) {
        appointments = await this.appointmentRepository.find({
          where: {
            created_at: Between(
              startOfDay(subDays(today, 14)),
              endOfDay(today),
            ),
            doctor: { uid: userId },
          },
          relations: ['doctor', 'patient'],
          select: {
            doctor: {
              name: true,
            },
            patient: {
              uid: true,
              name: true,
            },
            time: true,
            id: true,
            visitType: true,
            status: true,
            hasVisited: true,
            notes: true,
          },
        });
        todayAppointmentArray = await this.getTodayAppointments(appointments);
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
          relations: ['doctor', 'patient'],
          select: {
            doctor: {
              name: true,
            },
            patient: {
              uid: true,
              name: true,
            },
            time: true,
            id: true,
            visitType: true,
            status: true,
            hasVisited: true,
            notes: true,
          },
        });
        todayAppointmentArray = await this.getTodayAppointments(appointments);
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
      return { appointmentTrend, todayAppointmentArray };
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

  private async getTodayAppointments(
    appointments: Appointment[],
  ): Promise<Appointment[]> {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    const todayAppointments = appointments.filter((appointment) => {
      const appointmentDate = appointment.time.toISOString().split('T')[0];
      return appointmentDate === todayString;
    });

    return todayAppointments;
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
          time: Between(startOfDay(today), endOfDay(today)),
          startTime: Between(startOfDay(today), endOfDay(today)),
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
          time: Between(startOfDay(today), endOfDay(today)),
          startTime: Between(startOfDay(today), endOfDay(today)),
        },
      });
    }
    return { allAppointments, seenAppointments };
  }
}
