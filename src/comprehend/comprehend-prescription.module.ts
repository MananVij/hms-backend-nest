import { Module } from '@nestjs/common';
import { ComprehendPrescriptionService } from './comprehend-prescription.service';
import { ComprehendPrescriptionController } from './comprehend-prescription.controller';
import { PrescriptionModule } from 'src/prescription/presciption.module';
import { ErrorLogModule } from 'src/errorlog/error-log.module';
import { DjangoService } from 'src/django/django.service';

@Module({
  imports: [PrescriptionModule, ErrorLogModule],
  providers: [ComprehendPrescriptionService, DjangoService],
  controllers: [ComprehendPrescriptionController],
})
export class ComprehendPrescriptionModule {}
