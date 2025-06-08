import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AIRecommendationService } from '../services/ai-recommendation.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIMedicineRecommendationController {
  constructor(
    private readonly aiRecommendationService: AIRecommendationService,
  ) {}

  @Get('chief-complaints')
  async getChiefComplaints(
    @Query('specialization') specialization: string,
    @Request() req: any,
  ) {
    if (!specialization) {
      throw new HttpException(
        'Specialization parameter is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const doctorId = req.user?.uid;
    const result = await this.aiRecommendationService.getChiefComplaints(
      specialization,
      doctorId,
    );

    if (!result.success) {
      throw new HttpException(
        result.error || 'Failed to get chief complaints',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return result.data;
  }

  @Get('diagnosis-recommendations')
  async getDiagnosisRecommendations(
    @Query('chiefComplaint') chiefComplaint: string,
    @Query('specialization') specialization: string,
    @Request() req: any,
  ) {
    if (!chiefComplaint) {
      return [];
    }

    if (!specialization) {
      throw new HttpException(
        'Specialization parameter is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const doctorId = req.user?.uid;
    const result =
      await this.aiRecommendationService.getDiagnosisRecommendations(
        chiefComplaint,
        specialization,
        doctorId,
      );

    if (!result.success) {
      return [];
    }

    return result.data;
  }

  @Get('medicine-recommendations')
  async getMedicineRecommendations(
    @Query('diagnosis') diagnosis: string,
    @Query('specialization') specialization: string,
    @Query('chiefComplaint') chiefComplaint?: string,
    @Request() req?: any,
  ) {
    if (!diagnosis) {
      return [];
    }

    if (!specialization) {
      throw new HttpException(
        'Specialization parameter is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const doctorId = req.user?.uid;
    const result =
      await this.aiRecommendationService.getMedicineRecommendations({
        diagnosis,
        specialty: specialization,
        chiefComplaint,
        doctorId,
      });

    if (!result.success) {
      return [];
    }

    return result.data;
  }

  @Get('clinical-notes')
  async getClinicalNotes(
    @Query('diagnosis') diagnosis: string,
    @Query('specialization') specialization: string,
    @Request() req: any,
  ) {
    if (!diagnosis) {
      return [];
    }

    if (!specialization) {
      throw new HttpException(
        'Specialization parameter is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const doctorId = req.user?.uid;
    const result =
      await this.aiRecommendationService.getClinicalNotesRecommendations(
        diagnosis,
        specialization,
        doctorId,
      );

    if (!result.success) {
      return [];
    }

    return result.data;
  }
}
