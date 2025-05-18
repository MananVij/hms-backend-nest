import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoriteMedicineService } from './favorite-medicine.service';
import { FavoriteMedicineController } from './favorite-medicine.controller';
import { FavoriteMedicine } from './entity/favorite-medicine.entity';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { ErrorLogModule } from 'src/errorlog/error-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FavoriteMedicine, Doctor]),
    ErrorLogModule,
  ],
  providers: [FavoriteMedicineService],
  controllers: [FavoriteMedicineController],
})
export class FavoriteMedicineModule {}
