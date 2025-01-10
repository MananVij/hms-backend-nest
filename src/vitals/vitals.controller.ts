import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  NotFoundException,
  InternalServerErrorException,
  Req,
} from '@nestjs/common';
import { VitalsService } from './vitals.service';
import { CreateVitalsDto } from './dto/create-vitals.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { QueryRunner } from 'typeorm';
import { TransactionInterceptor } from 'src/transactions/transaction.interceptor';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';
import { Request } from 'src/interfaces/request.interface';

@Controller('vitals')
@UseGuards(JwtAuthGuard)
export class VitalsController {
  constructor(private readonly vitalsService: VitalsService) {}

  @Post()
  @UseInterceptors(TransactionInterceptor)
  async createVitals(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Req() req: Request,
    @Body() createVitalsDto: CreateVitalsDto,
  ): Promise<any> {
    const userId = req?.user?.uid
    try {
      return this.vitalsService.createVitals(queryRunner, userId, createVitalsDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Something went wrong. Failed to update metadata.',
      );
    }
  }
}
