import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { MetaDataService } from './meta-data.service';
import { UpdateMetaDataDto } from './dto/update-meta-data.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { QueryRunner } from 'typeorm';
import { TransactionInterceptor } from 'src/transactions/transaction.interceptor';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';

@Controller('meta-data')
@UseGuards(JwtAuthGuard)
export class MetaDataController {
  constructor(private readonly metaDataService: MetaDataService) {}

  @Put(':id')
  @UseInterceptors(TransactionInterceptor)
  async update(
    @Param('id') id: string,
    @Body() updateMetaDataDto: UpdateMetaDataDto,
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
  ) {
    try {
      return await this.metaDataService.update(
        id,
        updateMetaDataDto,
        queryRunner,
      );
    } catch (error) {
      throw error;
    }
  }
}
