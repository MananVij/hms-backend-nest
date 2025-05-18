import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Not, In } from 'typeorm';
import { Medicine } from './entity/medicine.entity';
import { FavoriteMedicine } from 'src/favourite-medicines/entity/favorite-medicine.entity';
import { ErrorLogService } from 'src/errorlog/error-log.service';

@Injectable()
export class MedicineService {
  constructor(
    @InjectRepository(Medicine)
    private readonly medicineRepo: Repository<Medicine>,
    @InjectRepository(FavoriteMedicine)
    private readonly favoriteRepo: Repository<FavoriteMedicine>,
    private readonly errorLogService: ErrorLogService,
  ) {}

  async searchMedicines(query: string, userId: string): Promise<Medicine[]> {
    try {
      // Get favorite medicine IDs for this user
      const favorites = await this.favoriteRepo.find({
        where: { doctor: { user: { uid: userId } } },
        relations: ['medicine'],
      });
      
      const favoriteIds = favorites.map(fav => fav.medicine.id);
      
      // If there are no favorites, just do a regular search
      if (favoriteIds.length === 0) {
        return this.medicineRepo.find({
          where: {
            name: ILike(`${query}%`),
          },
          take: 10,
          order: {
            name: 'ASC',
          },
          select: {
            id: true,
            name: true,
            composition: true,
            manufacturer: true,
          },
        });
      }
      // Exclude favorites from search results
      return this.medicineRepo.find({
        where: {
          name: ILike(`${query}%`),
          id: Not(In(favoriteIds)),
        },
        take: 10,
        order: {
          name: 'ASC',
        },
        select: {
          id: true,
          name: true,
          composition: true,
          manufacturer: true,
        },
      });
    } catch (error) {
      await this.errorLogService.logError(
        `Error in searchMedicines: ${error.message}`,
        error.stack || '',
        null,
        userId,
        null,
      );
      throw new InternalServerErrorException('Failed to search medicines');
    }
  }
}
