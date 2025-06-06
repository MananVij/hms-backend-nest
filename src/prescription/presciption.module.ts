import { Module } from '@nestjs/common';
import { PrescriptionService } from './prescription.service';
import { PrescriptionController } from './prescription.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prescription } from './entity/prescription.entity';
import { ErrorLogModule } from 'src/errorlog/error-log.module';
import { DjangoService } from 'src/django/django.service';
import { WhatsappModule } from 'src/whatsapp/whatsapp.module';
import { NotificationModule } from 'src/notification/notification.module';
import { UserClinicModule } from 'src/user_clinic/user_clinic.module';
import { MedicineRecommendationAIModule } from 'src/medicine-recommendation-ai-service/medicine-recommendation-ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Prescription]),
    ErrorLogModule,
    WhatsappModule,
    NotificationModule,
    UserClinicModule,
    MedicineRecommendationAIModule,
  ],
  controllers: [PrescriptionController],
  providers: [PrescriptionService, DjangoService],
  exports: [PrescriptionService],
})
export class PrescriptionModule {}
