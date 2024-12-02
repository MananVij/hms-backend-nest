import { Module } from '@nestjs/common';
import { ComprehendPrescriptionService } from './comprehend-prescription.service';
import { ComprehendPrescriptionController } from './comprehend-prescription.controller';
import { PrescriptionModule } from 'src/prescription/presciption.module';

@Module({
  imports: [PrescriptionModule],
  providers: [ComprehendPrescriptionService],
  controllers: [ComprehendPrescriptionController],
})
export class ComprehendPrescriptionModule {}
