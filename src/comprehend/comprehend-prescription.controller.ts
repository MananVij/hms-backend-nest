import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ComprehendPrescriptionService } from './comprehend-prescription.service';

@Controller('prescription')
export class ComprehendPrescriptionController {
  constructor(
    private readonly googleGenerativeAiService: ComprehendPrescriptionService,
  ) {}

  @Post('comprehend')
  async comprehendPrescription(
    @Body('fileName') fileName: string,
  ): Promise<any> {
    try {
      const result =
        await this.googleGenerativeAiService.comprehendPrescription(fileName);
      return result;
    } catch (error) {
      console.error(error);
      return error;
    }
  }
}
