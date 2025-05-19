import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { FavoriteMedicine } from './entity/favorite-medicine.entity';
import { Medicine } from 'src/medicine/entity/medicine.entity';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { ErrorLogService } from 'src/errorlog/error-log.service';

@Injectable()
export class FavoriteMedicineService {
  constructor(
    @InjectRepository(FavoriteMedicine)
    private readonly favoriteRepo: Repository<FavoriteMedicine>,
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
    private readonly errorLogService: ErrorLogService,
  ) {}

  async addFavorite(
    userId: string,
    dto: AddFavoriteDto,
  ): Promise<FavoriteMedicine> {
    try {
      const existing = await this.favoriteRepo.findOne({
        where: {
          doctor: { user: { uid: userId } },
          medicine: { id: dto.medicineId },
        },
      });
      if (existing) return existing;
      const doctorId = await this.doctorRepo.findOne({
        where: { user: { uid: userId } },
      });

      const fav = this.favoriteRepo.create({
        doctor: { id: doctorId.id },
        medicine: { id: dto.medicineId },
      });

      return this.favoriteRepo.save(fav);
    } catch (error) {
      await this.errorLogService.logError(
        `Error in addFavorite: ${error.message}`,
        error.stack || '',
        null,
        userId,
        null,
      );
      throw new InternalServerErrorException('Failed to add favorite medicine');
    }
  }

  async removeFavorite(userId: string, medicineId: number): Promise<void> {
    try {
      const fav = await this.favoriteRepo.findOne({
        where: {
          doctor: { user: { uid: userId } },
          medicine: { id: medicineId },
        },
      });

      if (!fav) throw new NotFoundException('Favorite not found');

      await this.favoriteRepo.remove(fav);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      await this.errorLogService.logError(
        `Error in removeFavorite: ${error.message}`,
        error.stack || '',
        null,
        userId,
        null,
      );
      throw new InternalServerErrorException(
        'Failed to remove favorite medicine',
      );
    }
  }

  async getFavorites(userId: string): Promise<any[]> {
    try {
      const favorites = await this.favoriteRepo.find({
        where: { doctor: { user: { uid: userId } } },
        relations: ['medicine'],
        order: { medicine: { name: 'ASC' } },
      });

      return favorites.map((fav) => ({
        id: fav.medicine.id,
        name: fav.medicine.name,
        manufacturer: fav.medicine.manufacturer,
        composition: fav.medicine.composition,
      }));
    } catch (error) {
      await this.errorLogService.logError(
        `Error in getFavorites: ${error.message}`,
        error.stack || '',
        null,
        userId,
        null,
      );
      throw new InternalServerErrorException(
        'Failed to get favorite medicines',
      );
    }
  }
}
