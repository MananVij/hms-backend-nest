import axios, { AxiosResponse } from 'axios';

import { Injectable } from '@nestjs/common';
import { ErrorLogService } from 'src/errorlog/error-log.service';
@Injectable()
export class DjangoService {
  constructor(private readonly errorLogService: ErrorLogService) {}
  async validateMedicines(medication: any[], clinic_id: number): Promise<any> {
    try {
      const response: AxiosResponse = await axios.post(
        `${process.env.DJANGO_API}/api/validate-medicines`,
        { medication },
        { params: { clinic_id } },
      );

      return response.data;
    } catch (error) {
      await this.errorLogService.logError(
        `Error in validating medicines: ${error?.message}`,
        error?.stack,
        null,
        null,
        null,
      );
      return null;
    }
  }

  async recordMedicineFeedback(
    medications: {
      original_name: string;
      medicine_name: string;
      rejected_matches: string[];
      no_match_found: boolean;
    }[],
    clinic_id: number,
  ): Promise<any> {
    try {
      console.log(medications);
      const response: AxiosResponse = await axios.post(
        `${process.env.DJANGO_API}/api/record-feedback`,
        { feedback_medications: medications },
        { params: { clinic_id } },
      );
      return response;
    } catch (error) {
      await this.errorLogService.logError(
        `Error in posting feedback of medicines: ${error?.message}`,
        error?.stack,
        null,
        null,
        null,
      );
      return null;
    }
  }
}
