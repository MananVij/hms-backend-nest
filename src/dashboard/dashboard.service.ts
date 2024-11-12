import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Appointment } from 'src/appointment/entity/appointment.entity';
import { User } from 'src/user/entity/user.enitiy';
import { DoctorPatient } from 'src/doctor_patient/entity/doctor_patient.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(DoctorPatient)
    private doctorPatientRepository: Repository<DoctorPatient>,
  ) {}

  async getDashboard(id: string): Promise<any> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0); // Set to start of the day

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999); // Set to end of the day

    /// get appointments
    const todayAppointments = await this.appointmentRepository.find({
      where: {
        doctor: { uid: id },
        startTime: Between(startOfToday, endOfToday),
      },
    });

    const todayAppointmentCount = todayAppointments.length;

    const patients = await this.doctorPatientRepository.find({
      where: { doctor: { user: { uid: id } } },
      relations: ['patient', 'patient.metadata'],
    });
    return { patients, todayAppointments, todayAppointmentCount };
  }
}
