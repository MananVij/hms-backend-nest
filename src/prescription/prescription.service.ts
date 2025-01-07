import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { Prescription } from './entity/prescription.entity';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { User, UserRole } from 'src/user/entity/user.enitiy';
import { ErrorLogService } from 'src/errorlog/error-log.service';
import { Appointment } from 'src/appointment/entity/appointment.entity';

@Injectable()
export class PrescriptionService {
  constructor(
    @InjectRepository(Prescription)
    private readonly prescriptionRepository: Repository<Prescription>,
    private readonly errorLogService: ErrorLogService,
  ) {}

  async create(
    createPrescriptionDto: CreatePrescriptionDto,
    queryRunner: QueryRunner,
  ): Promise<Prescription> {
    try {
      const {
        doctorId,
        patientId,
        vitalsId,
        appointmentId,
        ...prescriptionData
      } = createPrescriptionDto;

      const [doctor, patient, appointment] = await Promise.all([
        queryRunner.manager.findOne(User, {
          where: { uid: doctorId, role: UserRole.DOCTOR },
        }),
        queryRunner.manager.findOne(User, {
          where: { uid: patientId, role: UserRole.PATIENT },
        }),

        queryRunner.manager.findOne(Appointment, {
          where: { id: appointmentId },
        }),
      ]);
      if (!doctor || !patient) {
        throw new NotFoundException('Doctor or Patient not found');
      }

      const prescription = queryRunner.manager.create(Prescription, {
        ...prescriptionData,
        appointment,
        doctor,
        patient,
      });
      await queryRunner.manager.save(prescription);
      return prescription;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      await this.errorLogService.logError(
        `Error in creating prescription: ${error.message}`,
        error.stack,
        null,
        createPrescriptionDto?.doctorId,
        createPrescriptionDto?.patientId,
      );
      throw new InternalServerErrorException('Unable to save prescription.');
    }
  }

  // Find all prescriptions for a specific doctor
  async findPrescriptionsByDoctor(doctorId: string): Promise<Prescription[]> {
    try {
      const prescriptions = await this.prescriptionRepository.find({
        where: { doctor: { uid: doctorId } },
        relations: ['vitals'],
        order: { created_at: 'DESC' },
      });

      if (!prescriptions.length) {
        return [];
      }
      return prescriptions;
    } catch (error) {
      await this.errorLogService.logError(
        `Error in finding presctiption of doctor: ${error.message}`,
        error.stack,
        null,
        doctorId,
        null,
      );
    }
  }

  // Find all prescriptions for a specific patient
  async findPrescriptionsOfPatient(patientId: string): Promise<Prescription[]> {
    try {
      const prescriptions = await this.prescriptionRepository.find({
        where: { patient: { uid: patientId }, is_final_prescription: true },
        relations: ['vitals'],
        order: { created_at: 'DESC' },
      });
      if (!prescriptions.length) {
        return [];
      }
      return prescriptions;
    } catch (error) {
      await this.errorLogService.logError(
        `Error in finding prescription of Patient: ${error.message}`,
        error.stack,
        null,
        null,
        patientId,
      );
    }
  }

  // Find perticular prescription with prescription id
  async findOne(id: number): Promise<Prescription> {
    try {
      const prescription = await this.prescriptionRepository.findOne({
        where: { id },
        relations: ['vitals'],
      });
      if (!prescription) {
        return null;
      }
      return prescription;
    } catch (error) {
      await this.errorLogService.logError(
        error.message,
        error.stack,
        null,
        null,
        null,
      );
    }
  }
}
