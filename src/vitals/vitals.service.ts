import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
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

  async createVitals(
    createVitalsDto: CreateVitalsDto,
    queryRunner: QueryRunner,
  ): Promise<Vitals> {
    try {
      const { userId, ...vitalsData } = createVitalsDto;

      // Fetch associated User
      const user = await queryRunner.manager.findOne(User, {
        where: { uid: userId },
      });
      if (!user) {
        throw new NotFoundException(`User not found`);
      }
      const vitals = queryRunner.manager.create(Vitals, {
        ...vitalsData,
        user,
      });

      return queryRunner.manager.save(vitals);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      await this.errorLogRepository.logError(
        `Error in creating vitals: ${error.message}`,
        error.stack,
        null,
        null,
        createVitalsDto?.userId,
      );
      throw error;
    }
  }

  async getVitalsByPrescription(prescriptionId: number): Promise<Vitals[]> {
    return this.vitalsRepository.find({
      where: { prescription: { id: prescriptionId } },
    });
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
