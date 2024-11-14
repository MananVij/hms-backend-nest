import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vitals } from './entity/vitals.entity';
import { CreateVitalsDto } from './dto/create-vitals.dto';
import { User } from '../user/entity/user.enitiy';

@Injectable()
export class VitalsService {
  constructor(
    @InjectRepository(Vitals)
    private readonly vitalsRepository: Repository<Vitals>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createVitals(createVitalsDto: CreateVitalsDto): Promise<Vitals> {
    const { userId, ...vitalsData } = createVitalsDto;

    // Fetch associated User
    const user = await this.userRepository.findOne({ where: { uid: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    const vitals = this.vitalsRepository.create({
      ...vitalsData,
      user,
    });

    return this.vitalsRepository.save(vitals);
  }

  async getVitalsByPrescription(prescriptionId: number): Promise<Vitals[]> {
    return this.vitalsRepository.find({
      where: { prescription: { id: prescriptionId } },
    });
  }

  async updateVitals(id: number, updateVitalsDto: Partial<CreateVitalsDto>): Promise<Vitals> {
    await this.vitalsRepository.update(id, updateVitalsDto);
    return this.vitalsRepository.findOne({ where: { id } });
  }

  async getLatestVitalsByUser(userId: string): Promise<Vitals> {
    return this.vitalsRepository.findOne({
      where: { user: { uid: userId } },
      order: { createdAt: 'DESC' }, // Fetch the most recent vitals entry
    });
  }
}
