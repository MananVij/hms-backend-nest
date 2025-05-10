import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Clinic } from 'src/clininc/entity/clininc.entity';
import { User } from 'src/user/entity/user.enitiy';
import {
  LessThanOrEqual,
  MoreThanOrEqual,
  QueryRunner,
  Repository,
  Between,
  ILike,
} from 'typeorm';
import { PatientClinic } from './entity/patient_clinic.entity';
import { CreatePatientClinicDto } from './dto/patinet_clinic.dto';
import { ErrorLogService } from 'src/errorlog/error-log.service';
import { Appointment } from 'src/appointment/entity/appointment.entity';

@Injectable()
export class PatientClinicService {
  constructor(
    @InjectRepository(PatientClinic)
    private readonly patientClinicRepository: Repository<PatientClinic>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,

    private readonly errorLogService: ErrorLogService,
  ) {}

  async createPatientClinicRelationship(
    createUserClinicDto: CreatePatientClinicDto,
    queryRunner: QueryRunner,
  ): Promise<PatientClinic> {
    const { patientId, clinicId } = createUserClinicDto;
    try {
      const [patient, clinic] = await Promise.all([
        queryRunner.manager.findOne(User, {
          where: { uid: patientId, isPatient: true },
          relations: ['metaData'],
          select: {
            uid: true,
            name: true,
            phoneNumber: true,
            metaData: {
              dob: true,
              sex: true,
            },
            address: {
              line1: true,
              line2: true,
            },
          },
        }),
        queryRunner.manager.findOne(Clinic, { where: { id: clinicId } }),
      ]);
      const userClinic = this.patientClinicRepository.create({
        patient,
        clinic,
      });
      return await queryRunner.manager.save(userClinic);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      await this.errorLogService.logError(
        `Unable to create patient clinic relationship: ${error?.message}`,
        error?.stack,
        null,
        `ClinicId: ${clinicId}`,
        patientId,
      );
      throw new InternalServerErrorException('Something Went Wrong.');
    }
  }

  async checkPatientClinicRelationship(
    patientId: string,
    clinicId: number,
    queryRunner: QueryRunner,
  ) {
    try {
      const [patient, clinic] = await Promise.all([
        queryRunner.manager.findOne(User, { where: { uid: patientId } }),
        queryRunner.manager.findOne(Clinic, { where: { id: clinicId } }),
      ]);

      if (!patient) {
        throw new NotFoundException('Patient not found');
      }

      if (!clinic) {
        throw new NotFoundException('Clinic not found');
      }

      const existingRelation = await queryRunner.manager.findOne(
        PatientClinic,
        {
          where: { patient: { uid: patientId }, clinic: { id: clinicId } },
        },
      );
      return existingRelation;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      await this.errorLogService.logError(
        `Unable to check patient clinic relationship: ${error?.message}`,
        error?.stack,
        null,
        `Clinic Id: ${clinicId}`,
        patientId,
      );
      throw new InternalServerErrorException('Something went wrong.');
    }
  }

  async findAllPatientsByClinicIdOfAdmin(
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

      // Create the where conditions
      let where: any = {
        clinic: { id: clinicId },
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

      // search by patient name, patient id and phone number
      if (search) {
        const searchPattern = `%${search}%`;
        const originalPatientConditions = { ...where.patient };

        // Create an array of conditions for OR
        where = [
          {
            ...where,
            patient: {
              ...originalPatientConditions,
              name: ILike(searchPattern),
            },
          },
          {
            ...where,
            patient: {
              ...originalPatientConditions,
              phoneNumber: ILike(searchPattern),
            },
          },
          {
            ...where,
            patient: {
              ...originalPatientConditions,
              publicIdentifier: ILike(searchPattern),
            },
          },
        ];
      }

      // Add appointment date range conditions
      if (appointmentStart) {
        where.time = MoreThanOrEqual(new Date(appointmentStart));
      }

      if (appointmentEnd) {
        const endDate = new Date(appointmentEnd);
        endDate.setDate(endDate.getDate() + 1);

        if (where.time) {
          where.time = Between(where.time.value, endDate);
        } else {
          where.time = LessThanOrEqual(endDate);
        }
      }

      // Use findAndCount with proper options structure
      const [appointments, totalCount] =
        await this.appointmentRepository.findAndCount({
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
      const patientsData = Array.from(patientMap.values()).map(
        (appointment) => ({
          uid: appointment.patient.uid,
          name: appointment.patient.name,
          phoneNumber: appointment.patient.phoneNumber,
          publicIdentifier: appointment.patient.publicIdentifier,
          metaData: {
            dob: appointment.patient.metaData.dob,
            sex: appointment.patient.metaData.sex,
          },
          latestAppointmentDate: appointment.time,
        }),
      );

      return { data: patientsData, totalCount: totalCount };
    } catch (error) {
      await this.errorLogService.logError(
        `Error in finding patients of clinic: ${error.message}`,
        error.stack,
        null,
        null,
        null,
      );
      throw new InternalServerErrorException('Something Went Wrong!');
    }
  }
}
