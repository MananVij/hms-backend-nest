import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ErrorLogService } from './error-log.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('error')
@UseGuards(JwtAuthGuard)
export class ErrorLogController {
  constructor(private readonly errorLogService: ErrorLogService) {}

  @Post('')
  async logFrontendError(
    @Body()
    errorData: {
      error_message: string;
      stack_trace: string;
      audio_url?: string;
      doctor?: string;
      patient?: string;
    },
  ) {
    const { error_message, stack_trace, audio_url, doctor, patient } =
      errorData;

    try {
      await this.errorLogService.logError(
        error_message,
        stack_trace,
        audio_url,
        doctor,
        patient,
      );
      return { message: 'Error logged successfully' };
    } catch (err) {
      return { message: 'Error logging failed' };
    }
  }
}
