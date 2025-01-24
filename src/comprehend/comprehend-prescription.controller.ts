import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  InternalServerErrorException,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ComprehendPrescriptionService } from './comprehend-prescription.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TransactionInterceptor } from 'src/transactions/transaction.interceptor';
import { QueryRunner } from 'typeorm';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';
import { Request } from 'src/interfaces/request.interface';

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
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
    @Body('patient') patient: string,
    @Body('appointmentId') appointmentId: string,
    @Body('clinicId') clinicId: number,
  ): Promise<any> {
    try {
      const doctor = req?.user?.uid;
      const result =
        await this.googleGenerativeAiService.comprehendPrescription(
          file,
          doctor,
          patient,
          clinicId,
          appointmentId,
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
