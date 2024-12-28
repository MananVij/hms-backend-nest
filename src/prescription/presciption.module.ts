import { Module } from '@nestjs/common';
import { PrescriptionService } from './prescription.service';
import { PrescriptionController } from './prescription.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prescription } from './entity/prescription.entity';
import { ErrorLogModule } from 'src/errorlog/error-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([Prescription]), ErrorLogModule],
  controllers: [PrescriptionController],
  providers: [PrescriptionService],
  exports: [PrescriptionService],
})
export class PrescriptionModule {}
