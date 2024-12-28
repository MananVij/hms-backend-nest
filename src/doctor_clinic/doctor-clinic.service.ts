import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { DoctorClinic } from './entity/doctor_clinic.entity';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { Clinic } from 'src/clininc/entity/clininc.entity';

@Injectable()
export class DoctorClinicService {
  constructor(
    @InjectRepository(DoctorClinic)
    private readonly doctorClinicRepository: Repository<DoctorClinic>,
  ) {}

  async create(
    doctorId: string,
    clinicId: number,
    queryRunner: QueryRunner,
  ): Promise<DoctorClinic> {
    try {
      const [doctor, clinic] = await Promise.all([
        queryRunner.manager.findOne(Doctor, {
          where: { user: { uid: doctorId } },
        }),
        queryRunner.manager.findOne(Clinic, {
          where: { id: clinicId },
        }),
      ]);
      if (!doctor) {
        throw new NotFoundException('Doctor not found');
      }

      if (!clinic) {
        throw new NotFoundException('Clinic not found');
      }

      const existingDoctorClinic = await queryRunner.manager.findOne(
        DoctorClinic,
        {
          where: {
            doctor: { user: { uid: doctorId } },
            clinic: { id: clinicId },
          },
        },
      );

      if (existingDoctorClinic) {
        throw new ConflictException(
          'Doctor is already onboarded to this clinic',
        );
      }

      const doctorClinic = queryRunner.manager.create(DoctorClinic, {
        doctor,
        clinic,
      });

      return await queryRunner.manager.save(doctorClinic);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Something went wrong');
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
