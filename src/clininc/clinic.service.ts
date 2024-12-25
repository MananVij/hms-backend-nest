import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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

  async findAllByClinicIds(clinicIdArr: number[]): Promise<Clinic[]> {
    return await this.clinicRepository.find({
      where: { id: In(clinicIdArr) },
    });
  }

  async findOne(id: number): Promise<Clinic> {
    const clinic = await this.clinicRepository.findOne({
      where: { id },
      select: {
        id: true,
        name: true,
        line1: true,
        line2: true,
        pincode: true,
        contactNumber: true,
      },
    });
    if (!clinic) {
      return null;
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
}
