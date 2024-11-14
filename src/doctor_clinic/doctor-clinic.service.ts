import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorClinic } from './entity/doctor_clinic.entity';
import { CreateDoctorClinicDto } from './dto/create-doctor-clinic.dto';
import { Doctor } from '../doctor/entity/doctor.entity';
import { Clinic } from '../clininc/entity/clininc.entity';

@Injectable()
export class DoctorClinicService {
  constructor(
    @InjectRepository(DoctorClinic)
    private readonly doctorClinicRepository: Repository<DoctorClinic>,
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(Clinic)
    private readonly clinicRepository: Repository<Clinic>,
  ) {}

  async create(
    createDoctorClinicDto: CreateDoctorClinicDto,
  ): Promise<DoctorClinic> {
    const doctor = await this.doctorRepository.findOne({
      where: { id: createDoctorClinicDto.doctor_id },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const clinic = await this.clinicRepository.findOne({
      where: { id: createDoctorClinicDto.clinic_id },
    });
    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    // Create a new DoctorClinic instance
    const doctorClinic = this.doctorClinicRepository.create({
      doctor,
      clinic,
    });
    return this.doctorClinicRepository.save(doctorClinic);
  }

  async findAll(): Promise<DoctorClinic[]> {
    return this.doctorClinicRepository.find({
      relations: ['doctor', 'clinic'],
    });
  }

  async findOne(id: number): Promise<DoctorClinic> {
    const doctorClinic = await this.doctorClinicRepository.findOne({
      where: { id },
      relations: ['doctor', 'clinic'],
    });

    if (!doctorClinic) {
      throw new NotFoundException(`DoctorClinic with ID ${id} not found`);
    }

    return doctorClinic;
  }

  // Removes the Doctor from Clinic
  async removeDoctorFromClinic(
    doctorId: number,
    clinicId: number,
  ): Promise<void> {
    const result = await this.doctorClinicRepository.delete({
      doctor: { id: doctorId },
      clinic: { id: clinicId },
    });
    if (result.affected === 0) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }
  }
}
