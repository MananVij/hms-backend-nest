import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  InternalServerErrorException,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ComprehendPrescriptionService } from './comprehend-prescription.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('prescription')
@UseGuards(JwtAuthGuard)
export class ComprehendPrescriptionController {
  constructor(
    private readonly googleGenerativeAiService: ComprehendPrescriptionService,
  ) {}

  @Post('comprehend')
  @UseInterceptors(FileInterceptor('file'))
  async comprehendPrescription(
    @UploadedFile() file: Express.Multer.File,
    @Body('doctor') doctor: string,
    @Body('patient') patient: string,
  ): Promise<any> {
    try {
      const result =
        await this.googleGenerativeAiService.comprehendPrescription(
          file,
          doctor,
          patient,
        );
      return result;
    } catch (error) {
      throw new InternalServerErrorException(
        'There was an issue processing the prescription. Please try submitting the prescription voice again. If the issue persists, contact support.',
      );
    }
  }
}
