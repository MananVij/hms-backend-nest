import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clinic } from './entity/clininc.entity';
import { CreateClinicDto } from './dto/add-clinic.dto';
import { UpdateClinicDto } from './dto/update-clininc.dto';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { User } from 'src/user/entity/user.enitiy';

@Injectable()
export class ClinicService {
  constructor(
    @InjectRepository(Clinic)
    private clinicRepository: Repository<Clinic>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createClinicDto: CreateClinicDto): Promise<Clinic> {
    const admin = await this.userRepository.findOne({
      where: { uid: createClinicDto.admin_id },
    });
    if (!admin) {
      throw new Error('Admin not found');
    }

    const clinic = this.clinicRepository.create({ ...createClinicDto, admin });
    const savedClinic = await this.clinicRepository.save(clinic);
    admin.hasOnboardedClinic = true;
    await this.userRepository.save(admin);

    return savedClinic;
  }

  async findAll(): Promise<Clinic[]> {
    return await this.clinicRepository.find({ relations: ['doctorClinics'] });
  }

  async findOne(id: number): Promise<Clinic> {
    const clinic = await this.clinicRepository.findOne({
      where: { id },
      relations: ['doctorClinics', 'doctorClinics.doctor'],
    });
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${id} not found`);
    }
    return clinic;
  }

  async update(id: number, updateClinicDto: UpdateClinicDto): Promise<Clinic> {
    const clinic = await this.findOne(id);
    Object.assign(clinic, updateClinicDto);
    return await this.clinicRepository.save(clinic);
  }

  async remove(id: number): Promise<void> {
    const result = await this.clinicRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Clinic with ID ${id} not found`);
    }
  }

  async findAllClinicsOfAdmin(adminId: string): Promise<Clinic[]> {
    const clinics = await this.clinicRepository.find({
      where: { admin: { uid: adminId } },
    });
    if (!clinics.length) {
      throw new NotFoundException(`Clinic with ID ${adminId} not found`);
    }
    return clinics;
  }

  async findAllClinicsOfDoctor(doctorId: string): Promise<Clinic[]> {
    // return await this.clinicRepository.find({where: {doctorClinics: {doctor: {user: {uid: doctorId}}}}})
    const clinics = await this.clinicRepository
      .createQueryBuilder('clinic')
      .innerJoin('clinic.doctorClinics', 'doctorClinic')
      .innerJoin('doctorClinic.doctor', 'doctor')
      .innerJoin('doctor.user', 'user')
      .where('user.uid = :doctorId', { doctorId })
      .getMany();

    return clinics;
  }
}
