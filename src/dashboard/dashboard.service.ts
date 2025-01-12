import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ArrayContains,
  Between,
  In,
  IsNull,
  QueryRunner,
  Repository,
} from 'typeorm';
import { DoctorPatient } from 'src/doctor_patient/entity/doctor_patient.entity';
import { addDays, endOfDay, startOfDay, subDays } from 'date-fns';
import { UserRole } from 'src/user_clinic/entity/user_clinic.entity';
import { Appointment } from 'src/appointment/entity/appointment.entity';
import { AppointmentService } from 'src/appointment/appointment.service';
import { UserClinicService } from 'src/user_clinic/user_clinic.service';
import { PatientClinic } from 'src/patient_clinic/entity/patient_clinic.entity';
import { ErrorLogService } from 'src/errorlog/error-log.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(DoctorPatient)
    private readonly doctorPatientRepository: Repository<DoctorPatient>,

    @InjectRepository(PatientClinic)
    private readonly patientClinicRepository: Repository<PatientClinic>,

    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,

    private readonly appointmentService: AppointmentService,
    private readonly userClinicService: UserClinicService,
    private readonly errorLogService: ErrorLogService,
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
      const userRoles = await this.userClinicService.findUserRolesInClinic(
        queryRunner,
        userId,
        clinicId,
      );

      const [
        newPatinetTrend,
        appointmentTrend,
        todayAppointmentArray,
        appointmentCountTrend,
      ] = await Promise.all([
        this.findNewPatientTrend(userId, clinicId, userRoles, dates, {
          ...countByDate,
        }),
        this.findAppointmentTrend(
          userId,
          clinicId,
          userRoles,
          dates,
          { ...countByDate },
          today,
        ),
        this.appointmentService.findAllAppointments(
          queryRunner,
          userId,
          clinicId,
          true,
        ),
        this.appointmentComparisonTrend(userId, clinicId, userRoles),
      ]);
      return {
        newPatinetTrend,
        appointmentCountTrend,
        todayAppointmentArray,
        appointmentTrend,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Something went wrong. Unable to fetch dashboard details at moment.',
      );
    }
  }

  private async findNewPatientTrend(
    userId: string,
    clinicId: number,
    role: UserRole[],
    dates: Date[],
    patientCountByDate: { [key: string]: number },
  ) {
    const today = new Date();
    var patients = [];
    try {
      if (role.includes(UserRole.ADMIN)) {
        patients = await this.patientClinicRepository.find({
          where: {
            clinic: { id: clinicId },
            created_at: Between(
              startOfDay(subDays(today, 14)),
              endOfDay(today),
            ),
          },
        });
      } else if (role.includes(UserRole.DOCTOR)) {
        patients = await this.doctorPatientRepository.find({
          where: {
            doctor: { user: { uid: userId } },
            created_at: Between(
              startOfDay(subDays(today, 14)),
              endOfDay(today),
            ),
          },
        });
      }
      patients.forEach((patient) => {
        const patientDate = patient?.created_at?.toISOString()?.split('T')?.[0];
        if (patientCountByDate?.[patientDate] !== undefined) {
          patientCountByDate[patientDate]++;
        }
      });

      const patientTrend = dates?.map((date) => {
        const formattedDate = date?.toISOString()?.split('T')?.[0];
        return {
          date: formattedDate,
          count: patientCountByDate?.[formattedDate],
        };
      });
      return patientTrend;
    } catch (error) {
      await this.errorLogService.logError(
        error.message,
        error.stack,
        userId,
        null,
        null,
      );
    }
    throw new InternalServerErrorException(
      'Something went wrong. Unable to fetch dashboard details at moment.',
    );
  }
  private async findAppointmentTrend(
    userId: string,
    clinicId: number,
    role: UserRole[],
    dates: Date[],
    appointmentCountByDate: { [key: string]: number },
    today: Date,
  ) {
    var appointments = [];
    try {
      if (role.includes(UserRole.ADMIN)) {
        appointments = await this.appointmentRepository.find({
          where: {
            time: Between(startOfDay(subDays(today, 14)), endOfDay(today)),
            clinic: { id: clinicId },
          },
          select: {
            time: true,
          },
        });
      } else if (role.includes(UserRole.DOCTOR)) {
        appointments = await this.appointmentRepository.find({
          where: {
            time: Between(startOfDay(subDays(today, 14)), endOfDay(today)),
            doctor: { uid: userId },
            clinic: { id: clinicId },
          },
          select: { time: true },
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
      await this.errorLogService.logError(
        error.message,
        error.stack,
        userId,
        null,
        null,
      );
      throw new InternalServerErrorException('Something Went Wrong');
    }
  }

  private async appointmentComparisonTrend(
    userId: string,
    clinicId: number,
    role: UserRole[],
  ) {
    const today = new Date();
    let seenAppointments = 0;
    let allAppointments = 0;
    try {
      if (role.includes(UserRole.ADMIN)) {
        const adminDoctorIds = await this.userClinicService.findStaffOfClinic(
          clinicId,
          { role: ArrayContains([UserRole.DOCTOR]) },
        );
        const doctorIds = adminDoctorIds.map((doctor) => doctor.user.uid);
        console.log(adminDoctorIds);
        allAppointments = await this.appointmentRepository.count({
          where: {
            doctor: { uid: In(doctorIds) },
            clinic: { id: clinicId },
            time: Between(startOfDay(today), endOfDay(today)),
          },
        });
        seenAppointments = await this.appointmentRepository.count({
          where: {
            doctor: { uid: In(doctorIds) },
            prescription: IsNull(),
            clinic: { id: clinicId },
            time: Between(startOfDay(today), endOfDay(today)),
          },
        });
      } else if (role.includes(UserRole.DOCTOR)) {
        allAppointments = await this.appointmentRepository.count({
          where: {
            doctor: { uid: userId },
            clinic: { id: clinicId },
            time: Between(startOfDay(today), endOfDay(today)),
          },
        });

        seenAppointments = await this.appointmentRepository.count({
          where: {
            doctor: { uid: userId },
            prescription: IsNull(),
            clinic: { id: clinicId },
            time: Between(startOfDay(today), endOfDay(today)),
          },
        });
      }

      return { allAppointments, seenAppointments };
    } catch (error) {
      await this.errorLogService.logError(
        error.message,
        error.stack,
        userId,
        null,
        null,
      );
    }
    throw new InternalServerErrorException(
      'Something went wrong. Unable to fetch dashboard details at moment.',
    );
  }
}
