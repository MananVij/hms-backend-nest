import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescription } from './entity/prescription.entity';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { User } from '../user/entity/user.enitiy';
import { Vitals } from '../vitals/entity/vitals.entity';

@Injectable()
export class PrescriptionService {
  constructor(
    @InjectRepository(Prescription)
    private readonly prescriptionRepository: Repository<Prescription>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Vitals)
    private readonly vitalsRepository: Repository<Vitals>,
  ) {}

  async create(createPrescriptionDto: CreatePrescriptionDto): Promise<any> {
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
    let vitals = null;
    if (vitalsId) {
      vitals = await this.vitalsRepository.findOne({ where: { id: vitalsId } });
      if (!vitals) throw new NotFoundException('Vitals not found');
    }

    // Create a new prescription entity
    const prescription = this.prescriptionRepository.create({
      ...prescriptionData,
      doctor,
      patient,
      vitals,
    });

    await this.prescriptionRepository.save(prescription);
    return prescriptionData;
  }

  // Find all prescriptions for a specific doctor
  async findPrescriptionsByDoctor(doctorId: string): Promise<Prescription[]> {
    const prescriptions = await this.prescriptionRepository.find({
      where: { doctor: { uid: doctorId } },
      relations: ['vitals'],
    });

    if (!prescriptions.length) {
      throw new NotFoundException(
        `No prescriptions found for Doctor with ID ${doctorId}`,
      );
    }
    return prescriptions;
  }

  // Find all prescriptions for a specific patient
  async findPrescriptionsOfPatient(patientId: string): Promise<Prescription[]> {
    const prescriptions = await this.prescriptionRepository.find({
      where: { patient: { uid: patientId } },
      relations: ['vitals'],
    });

    if (!prescriptions.length) {
      throw new NotFoundException(
        `No prescriptions found for Patient with ID ${patientId}`,
      );
    }
    return prescriptions;
  }

  // Find perticular prescription with prescription id
  async findOne(id: number): Promise<Prescription> {
    const prescription = await this.prescriptionRepository.findOne({
      where: { id },
      relations: ['vitals'],
    });
    if (!prescription) {
      throw new NotFoundException(`Prescription with ID ${id} not found`);
    }
    return prescription;
  }

  async remove(id: number): Promise<void> {
    const prescription = await this.findOne(id);
    await this.prescriptionRepository.remove(prescription);
  }
}
