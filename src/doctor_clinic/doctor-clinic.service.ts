import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorClinic } from './entity/doctor_clinic.entity';
import { CreateDoctorClinicDto } from './dto/create-doctor-clinic.dto';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { Clinic } from 'src/clininc/entity/clininc.entity';

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

  async create(doctorId: string, clinicId: number): Promise<DoctorClinic> {
    try {
      const [doctor, clinic] = await Promise.all([
        this.doctorRepository.findOne({
          where: { user: { uid: doctorId } },
        }),
        this.clinicRepository.findOne({
          where: { id: clinicId },
        }),
      ]);
      if (!doctor) {
        throw new NotFoundException('Doctor not found');
      }

      if (!clinic) {
        throw new NotFoundException('Clinic not found');
      }

      const existingDoctorClinic = await this.doctorClinicRepository.findOne({
        where: {
          doctor: { user: { uid: doctorId } },
          clinic: { id: clinicId },
        },
      });

      if (existingDoctorClinic) {
        throw new ConflictException(
          'Doctor is already onboarded to this clinic',
        );
      }

      const doctorClinic = this.doctorClinicRepository.create({
        doctor,
        clinic,
      });

      return await this.doctorClinicRepository.save(doctorClinic);
    } catch (error) {
      throw error instanceof Error
        ? error
        : new InternalServerErrorException('An unexpected error occurred');
    }
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
