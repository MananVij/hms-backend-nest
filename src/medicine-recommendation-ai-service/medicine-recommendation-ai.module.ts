import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { AIChiefComplaint } from './entity/ai-chief-complaint.entity';
import { AIRecommendationService } from './services/ai-recommendation.service';
import { AIMedicineRecommendationController } from './controllers/ai-medicine-recommendation.controller';
import { ErrorLogModule } from 'src/errorlog/error-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AIChiefComplaint,
    ]),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ErrorLogModule,
  ],
  controllers: [AIMedicineRecommendationController],
  providers: [AIRecommendationService],
  exports: [AIRecommendationService],
})
export class MedicineRecommendationAIModule {}
