import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './entity/doctor.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { User } from 'src/user/entity/user.enitiy';
import { DoctorClinicService } from 'src/doctor_clinic/doctor-clinic.service';
import { UserService } from 'src/user/user.service';
import { MetaDataService } from 'src/metadata/meta-data.service';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly userService: UserService,
    private readonly metaDataService: MetaDataService,
    private readonly doctorClinicService: DoctorClinicService,
  ) {}

  async create(createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    const { userData, clinicId, staffData, metaData } = createDoctorDto;

    const foundUser = await this.userRepository.findOne({
      where: [{ email: userData.email }, { phoneNumber: userData.phoneNumber }],
    });
    if (foundUser) {
      throw new ConflictException('Credentials already in use.');
    }

    const user = await this.userService.createUser(userData);
    await this.metaDataService.create({
      ...metaData,
      uid: user.uid,
    });
    const doctor = this.doctorRepository.create({
      ...staffData,
      user, // Link the user entity to the doctor
    });
    const createdDoctor = await this.doctorRepository.save(doctor);
    await this.doctorClinicService.create({
      doctor_id: createdDoctor.id,
      clinic_id: clinicId,
    });
    return createdDoctor;
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
      relations: ['doctorClinics.clinic', 'user'],
      select: {
        user: {
          name: true,
          email: true,
          phoneNumber: true,
          role: true,
          address: {
            line1: true,
            line2: true,
            pincode: true,
          },
        },
        doctorClinics: {
          id: true,
          clinic: {
            name: true,
            line1: true,
            line2: true,
            pincode: true,
            contactNumber: true
          }
        }
      },
    });
    return doctors;
  }

  // Returns doctors associated in clinic
  async findDoctorsByClinicId(id: number): Promise<Doctor[]> {
    const doctors = await this.doctorRepository.find({
      where: { doctorClinics: { clinic: { id } } },
      relations: ['user'],
      select: {
        id: true,
        timings: true,
        user: {
          name: true,
          uid: true,
        },
      },
    });
    const formattedDoctors = doctors.map((doctor) => ({
      ...doctor,
      name: doctor.user?.name,
      uid: doctor.user?.uid,
      user: undefined,
    }));
    return formattedDoctors;
  }
}
