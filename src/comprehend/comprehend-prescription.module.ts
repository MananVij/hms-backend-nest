import { Module } from '@nestjs/common';
import { ComprehendPrescriptionService } from './comprehend-prescription.service';
import { ComprehendPrescriptionController } from './comprehend-prescription.controller';

@Module({
  providers: [ComprehendPrescriptionService],
  controllers: [ComprehendPrescriptionController],
})
export class ComprehendPrescriptionModule {}
