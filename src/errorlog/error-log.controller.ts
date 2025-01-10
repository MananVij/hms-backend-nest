import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ErrorLogService } from './error-log.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request } from 'src/interfaces/request.interface';

@Controller('error')
@UseGuards(JwtAuthGuard)
export class ErrorLogController {
  constructor(private readonly errorLogService: ErrorLogService) {}

  @Post('')
  async logFrontendError(
    @Req() req: Request,
    @Body()
    errorData: {
      error_message: string;
      stack_trace: string;
      audio_url?: string;
      patient?: string;
    },
  ) {
    const { error_message, stack_trace, audio_url, patient } = errorData;
    const userId = req?.user?.uid;

    try {
      await this.errorLogService.logError(
        error_message,
        stack_trace,
        audio_url,
        userId,
        patient,
      );
      return { message: 'Error logged successfully' };
    } catch (err) {
      return { message: 'Error logging failed' };
    }
  }
}
