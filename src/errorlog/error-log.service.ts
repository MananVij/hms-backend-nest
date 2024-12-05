import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorLog } from './error-log.entity';

@Injectable()
export class ErrorLogService {
  constructor(
    @InjectRepository(ErrorLog)
    private readonly errorLogRepository: Repository<ErrorLog>,
  ) {}

  async logError(
    error_message: string,
    stack_trace: string,
    audio_url?: string,
    doctor?: string,
    patient?: string,
  ): Promise<ErrorLog> {
    const errorLog = this.errorLogRepository.create({
      error_message,
      stack_trace,
      audio_url,
      doctor,
      patient,
    });
    return this.errorLogRepository.save(errorLog);
  }
}
