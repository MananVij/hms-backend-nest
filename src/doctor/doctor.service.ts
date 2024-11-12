import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './entity/doctor.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { User } from 'src/user/entity/user.enitiy';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    const { user, ...doctorData } = createDoctorDto;

    const foundUser = await this.userRepository.findOne({
      where: { uid: user },
    });

    if (!foundUser) {
      throw new NotFoundException('User not found');
    }

    // Create a doctor instance
    const doctor = this.doctorRepository.create({
      ...doctorData,
      user: foundUser, // Link the user entity to the doctor
    });

    return this.doctorRepository.save(doctor);
  }

  // Gets List of All Doctors
  async findAll(): Promise<Doctor[]> {
    return this.doctorRepository.find();
  }

  // Deletes the Dcotor Account
  async delete(id: number): Promise<void> {
    const result = await this.doctorRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }
  }

  async findDoctor(id: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { user: { uid: id } },
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }
    return doctor;
  }
  // Returns doctors associated with admin
  async findByAdminId(id: string): Promise<Doctor[]> {
    const doctors = await this.doctorRepository.find({
      where: { doctorClinics: { clinic: { admin: { uid: id } } } },
    });
    return doctors;
  }

  // Returns doctors associated in clinic
  async findDoctorsByClinicId(id: number): Promise<Doctor[]> {
    const doctors = await this.doctorRepository.find({
      where: { doctorClinics: { clinic: { id } } },
    });
    return doctors;
  }
}
