import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  InternalServerErrorException,
  Body,
} from '@nestjs/common';
import { ComprehendPrescriptionService } from './comprehend-prescription.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('prescription')
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
      console.error(error);
      throw new InternalServerErrorException(
        'Failed to comprehend prescription',
      );
    }
  }
}
