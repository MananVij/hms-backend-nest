import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Medicine } from './entity/medicine.entity';
import { MedicineService } from './medicine.service';
import { MedicineController } from './medicine.controller';
import { FavoriteMedicine } from 'src/favourite-medicines/entity/favorite-medicine.entity';
import { ErrorLogModule } from 'src/errorlog/error-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Medicine, FavoriteMedicine]),
    ErrorLogModule,
  ],
  providers: [MedicineService],
  controllers: [MedicineController],
})
export class MedicineModule {}
