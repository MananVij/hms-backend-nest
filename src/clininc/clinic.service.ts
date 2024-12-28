import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryRunner, Repository } from 'typeorm';
import { Clinic } from './entity/clininc.entity';
import { CreateClinicDto } from './dto/add-clinic.dto';
import { UpdateClinicDto } from './dto/update-clininc.dto';
import { User } from 'src/user/entity/user.enitiy';

@Injectable()
export class ClinicService {
  constructor(
    @InjectRepository(Clinic)
    private clinicRepository: Repository<Clinic>,
  ) {}

  async create(
    createClinicDto: CreateClinicDto,
    queryRunner: QueryRunner,
  ): Promise<Clinic> {
    try {
      const admin = await queryRunner.manager.findOne(User, {
        where: { uid: createClinicDto.admin_id },
      });
      if (!admin) {
        throw new NotFoundException('Admin not found');
      }

      const clinic = queryRunner.manager.create(Clinic, {
        ...createClinicDto,
        admin,
      });
      const savedClinic = await queryRunner.manager.save(clinic);
      admin.hasOnboardedClinic = true;
      await queryRunner.manager.save(admin);

      return savedClinic;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Something Went Wrong.');
    }
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

  async update(
    id: number,
    updateClinicDto: UpdateClinicDto,
    queryRunner: QueryRunner,
  ): Promise<Clinic> {
    try {
      const clinic = await queryRunner.manager.findOne(Clinic, {
        where: { id },
      });
      if (!clinic) {
        throw new NotFoundException('Clinic not found');
      }
      Object.assign(clinic, updateClinicDto);
      return await queryRunner.manager.save(clinic);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Something Went Wrong.');
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.clinicRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Clinic with ID ${id} not found`);
    }
  }
}
