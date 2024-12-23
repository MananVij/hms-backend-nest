import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Prescription } from './entity/prescription.entity';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { User } from 'src/user/entity/user.enitiy';
import { Vitals } from 'src/vitals/entity/vitals.entity';
import { ErrorLogService } from 'src/errorlog/error-log.service';

@Injectable()
export class PrescriptionService {
  constructor(
    @InjectRepository(Prescription)
    private readonly prescriptionRepository: Repository<Prescription>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Vitals)
    private readonly vitalsRepository: Repository<Vitals>,

    private readonly errorLogService: ErrorLogService,
  ) {}

  async create(createPrescriptionDto: CreatePrescriptionDto): Promise<any> {
    try {
      const { doctorId, patientId, vitalsId, ...prescriptionData } =
        createPrescriptionDto;

      // Find and validate the doctor and patient
      const doctor = await this.userRepository.findOne({
        where: { uid: doctorId },
      });
      const patient = await this.userRepository.findOne({
        where: { uid: patientId },
      });

      if (!doctor || !patient) {
        throw new NotFoundException('Doctor or Patient not found');
      }

      // Find the vitals if provided
      const date = new Date(); // Current time
      const oneHourAgo = new Date(date.getTime() - 1 * 60 * 60 * 1000); // One hour ago

      const vitals = await this.vitalsRepository.findOne({
        where: { createdAt: Between(oneHourAgo, date) },
        order: { createdAt: 'DESC' },
      });

      // Create a new prescription entity
      const prescription = this.prescriptionRepository.create({
        ...prescriptionData,
        doctor,
        patient,
        vitals,
      });
      await this.prescriptionRepository.save(prescription);
      return prescription;
    } catch (error) {
      await this.errorLogService.logError(
        `Error in creating prescription: ${error.message}`,
        error.stack,
        null,
        createPrescriptionDto?.doctorId,
        createPrescriptionDto?.patientId,
      );
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

  async remove(id: number): Promise<void> {
    const prescription = await this.findOne(id);
    await this.prescriptionRepository.remove(prescription);
  }
}
