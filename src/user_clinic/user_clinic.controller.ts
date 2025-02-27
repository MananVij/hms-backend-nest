import {
  Controller,
  Body,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { UserClinicService } from './user_clinic.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';
import { QueryRunner } from 'typeorm';

@Controller('staff-clinic')
@UseGuards(JwtAuthGuard)
export class UserClinicController {
  constructor(private readonly userClinicService: UserClinicService) {}

  // add check for super admin later
  @Patch('pad-type')
  async updatePadType(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Body()
    body: { userId: string; clinicId: number; usesOwnLetterPad: boolean },
  ): Promise<any> {
    try {
      return await this.userClinicService.changePrescriptionPadType(
        queryRunner,
        body.userId,
        body.clinicId,
        body.usesOwnLetterPad,
      );
    } catch (error) {
      throw error;
    }
  }

  // add check for super admin later
  @Patch('padding')
  async updatePrescriptionPadding(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Body()
    body: {
      userId: string;
      clinicId: number;
      padding: {
        paddingTop?: number | null;
        paddingLeft?: number | null;
        paddingBottom?: number | null;
        paddingRight?: number | null;
      };
    },
  ): Promise<any> {
    try {
      return await this.userClinicService.updatePrescriptionPadding(
        queryRunner,
        body.userId,
        body.clinicId,
        body.padding,
      );
    } catch (error) {
      throw error;
    }
  }
}
