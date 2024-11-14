import { Module } from '@nestjs/common';
import { PrescriptionService } from './prescription.service';
import { PrescriptionController } from './prescription.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prescription } from './entity/prescription.entity';
import { User } from 'src/user/entity/user.enitiy';
import { Vitals } from 'src/vitals/entity/vitals.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Prescription, User, Vitals])],
  controllers: [PrescriptionController],
  providers: [PrescriptionService],
  exports: [PrescriptionService],
})
export class PrescriptionModule {}
