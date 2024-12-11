import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vitals } from './entity/vitals.entity';
import { CreateVitalsDto } from './dto/create-vitals.dto';
import { User } from 'src/user/entity/user.enitiy';
import { ErrorLogService } from 'src/errorlog/error-log.service';

@Injectable()
export class VitalsService {
  constructor(
    @InjectRepository(Vitals)
    private readonly vitalsRepository: Repository<Vitals>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly errorLogRepository: ErrorLogService,
  ) {}

  async createVitals(createVitalsDto: CreateVitalsDto): Promise<Vitals> {
    try {
      const { userId, ...vitalsData } = createVitalsDto;

      // Fetch associated User
      const user = await this.userRepository.findOne({
        where: { uid: userId },
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      const vitals = this.vitalsRepository.create({
        ...vitalsData,
        user,
      });

      return this.vitalsRepository.save(vitals);
    } catch (error) {
      await this.errorLogRepository.logError(
        `Error in creating vitals: ${error.message}`,
        error.stack,
        null,
        null,
        createVitalsDto?.userId,
      );
    }
  }

  async getVitalsByPrescription(prescriptionId: number): Promise<Vitals[]> {
    return this.vitalsRepository.find({
      where: { prescription: { id: prescriptionId } },
    });
  }

  async updateVitals(
    id: number,
    updateVitalsDto: Partial<CreateVitalsDto>,
  ): Promise<Vitals> {
    try {
      await this.vitalsRepository.update(id, updateVitalsDto);
      return this.vitalsRepository.findOne({ where: { id } });
    } catch (error) {
      await this.errorLogRepository.logError(
        `Error in updating vitals: ${error.message}`,
        error.stack,
        null,
        null,
        null,
      );
    }
  }

  async getLatestVitalsByUser(userId: string): Promise<Vitals> {
    try {
      return this.vitalsRepository.findOne({
        where: { user: { uid: userId } },
        order: { createdAt: 'DESC' }, // Fetch the most recent vitals entry
      });
    } catch (error) {
      await this.errorLogRepository.logError(
        `Error in fetching latest vitals: ${error.message}`,
        error.stack,
        null,
        null,
        null,
      );
    }
  }
}
