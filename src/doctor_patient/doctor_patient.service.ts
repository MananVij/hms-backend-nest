import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorPatient } from './entity/doctor_patient.entity';
import { ErrorLogService } from 'src/errorlog/error-log.service';
import { Appointment } from 'src/appointment/entity/appointment.entity';
import {
  LessThanOrEqual,
  MoreThanOrEqual,
  Between,
  ILike,
} from 'typeorm';

@Injectable()
export class DoctorPatientService {
  constructor(
    @InjectRepository(DoctorPatient)
    private readonly doctorPatientRepository: Repository<DoctorPatient>,
    private readonly errorLogService: ErrorLogService,
  ) {}
  async findAllPatientsOfDoctorByClinicId(
    doctorId: string,
    clinicId: number,
    ageMin?: number,
    ageMax?: number,
    sex?: string,
    appointmentStart?: string,
    appointmentEnd?: string,
    page: number = 1,
    pageSize: number = 50,
    search?: string,
  ): Promise<{ data: any[]; totalCount: number }> {
    try {
      const pageNum = Number(page) || 1;
      const pageSizeNum = Number(pageSize) || 50;
      const skip = (pageNum - 1) * pageSizeNum;

      // Get the appointment repository
      const appointmentRepo =
        this.doctorPatientRepository.manager.getRepository(Appointment);

      // Create the where conditions
      let where: any = {
        clinic: { id: clinicId },
        doctor: { uid: doctorId },
      };

      // Add patient conditions
      where.patient = {};

      // Add metadata conditions if needed
      if (sex || ageMin || ageMax) {
        where.patient.metaData = {};

        if (sex) {
          where.patient.metaData.sex = sex.toUpperCase();
        }

        // Handle age filter by converting to DOB range
        if (ageMin || ageMax) {
          const today = new Date();

          if (ageMin && ageMax) {
            const maxDob = new Date(today);
            maxDob.setFullYear(today.getFullYear() - ageMin);

            const minDob = new Date(today);
            minDob.setFullYear(today.getFullYear() - ageMax - 1);
            minDob.setDate(minDob.getDate() + 1);

            where.patient.metaData.dob = Between(minDob, maxDob);
          } else if (ageMin) {
            const maxDob = new Date(today);
            maxDob.setFullYear(today.getFullYear() - ageMin);
            where.patient.metaData.dob = LessThanOrEqual(maxDob);
          } else if (ageMax) {
            const minDob = new Date(today);
            minDob.setFullYear(today.getFullYear() - ageMax - 1);
            minDob.setDate(minDob.getDate() + 1);
            where.patient.metaData.dob = MoreThanOrEqual(minDob);
          }
        }
      }

      // Add appointment date range conditions
      if (appointmentStart) {
        where.time = MoreThanOrEqual(new Date(appointmentStart));
      }

      if (appointmentEnd) {
        const endDate = new Date(appointmentEnd);
        endDate.setDate(endDate.getDate() + 1);

        if (where.time) {
          // If we already have a time condition, modify it to be a range
          where.time = Between(where.time.value, endDate);
        } else {
          where.time = LessThanOrEqual(endDate);
        }
      }

      // search by patient name, patient id and phone number
      if (search) {
        const searchPattern = `%${search}%`;
        const originalPatientConditions = { ...where.patient };
        const otherConditions = { ...where };
        delete otherConditions.patient;

        // Create an array of conditions for OR
        where = [
          {
            ...otherConditions,
            patient: {
              ...originalPatientConditions,
              name: ILike(searchPattern),
            },
          },
          {
            ...otherConditions,
            patient: {
              ...originalPatientConditions,
              phoneNumber: ILike(searchPattern),
            },
          },
          {
            ...otherConditions,
            patient: {
              ...originalPatientConditions,
              publicIdentifier: ILike(searchPattern),
            },
          },
        ];
      }
      // Use findAndCount with proper options structure
      const [appointments, totalCount] = await appointmentRepo.findAndCount({
        where,
        relations: ['patient', 'patient.metaData'],
        order: { time: 'DESC' },
        skip,
        take: pageSizeNum,
      });

      // Process the results
      const patientMap = new Map();

      // Get only the latest appointment for each patient
      appointments.forEach((appointment) => {
        const patientId = appointment.patient.uid;

        if (
          !patientMap.has(patientId) ||
          new Date(appointment.time) > new Date(patientMap.get(patientId).time)
        ) {
          patientMap.set(patientId, appointment);
        }
      });

      // Convert to array of patient data with latest appointment
      const result = Array.from(patientMap.values()).map((appointment) => ({
        uid: appointment.patient.uid,
        name: appointment.patient.name,
        phoneNumber: appointment.patient.phoneNumber,
        publicIdentifier: appointment.patient.publicIdentifier,
        metaData: {
          dob: appointment.patient.metaData.dob,
          sex: appointment.patient.metaData.sex,
        },
        latestAppointmentDate: appointment.time,
      }));

      return { data: result, totalCount };
    } catch (error) {
      await this.errorLogService.logError(
        `Unable to find all patients of doctor by clinic id: ${error?.message}`,
        error?.stack,
        null,
        doctorId,
        null,
      );
      throw new InternalServerErrorException(
        'Something went wrong. Unable to find patients of doctor at this moment.',
      );
    }
  }
}
