import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  InternalServerErrorException,
  Body,
  UseGuards,
  Req,
  PayloadTooLargeException,
  BadRequestException,
  Logger,
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
      if (!file) {
        throw new BadRequestException('File is missing.');
      }

      const fileSizeMB = file.size / (1024 * 1024);
      Logger.log(`Uploaded file size: ${fileSizeMB.toFixed(2)} MB`);

      const MAX_FILE_SIZE_MB = 10;
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        throw new PayloadTooLargeException(
          `File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`,
        );
      }

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
      if(error instanceof PayloadTooLargeException) {
        throw error
      }
      throw new InternalServerErrorException(
        'There was an issue processing the prescription. Please try submitting the prescription voice again. If the issue persists, contact support.',
      );
    }
  }
}
