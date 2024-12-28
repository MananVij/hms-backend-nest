import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  InternalServerErrorException,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ComprehendPrescriptionService } from './comprehend-prescription.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TransactionInterceptor } from 'src/transactions/transaction.interceptor';
import { QueryRunner } from 'typeorm';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';

@Controller('prescription')
@UseGuards(JwtAuthGuard)
export class ComprehendPrescriptionController {
  constructor(
    private readonly googleGenerativeAiService: ComprehendPrescriptionService,
  ) {}

  @Post('comprehend')
  @UseInterceptors(FileInterceptor('file'))
  @UseInterceptors(TransactionInterceptor)
  async comprehendPrescription(
    @UploadedFile() file: Express.Multer.File,
    @Body('doctor') doctor: string,
    @Body('patient') patient: string,
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
  ): Promise<any> {
    try {
      const result =
        await this.googleGenerativeAiService.comprehendPrescription(
          file,
          doctor,
          patient,
          queryRunner,
        );
      return result;
    } catch (error) {
      throw new InternalServerErrorException(
        'There was an issue processing the prescription. Please try submitting the prescription voice again. If the issue persists, contact support.',
      );
    }
  }
}
