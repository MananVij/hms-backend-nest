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
  Query,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { MetaDataService } from './meta-data.service';
import { CreateMetaDataDto } from './dto/create-meta-data.dto';
import { UpdateMetaDataDto } from './dto/update-meta-data.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { QueryRunner } from 'typeorm';
import { TransactionInterceptor } from 'src/transactions/transaction.interceptor';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';

@Controller('meta-data')
@UseGuards(JwtAuthGuard)
export class MetaDataController {
  constructor(private readonly metaDataService: MetaDataService) {}

  @Post()
  @UseInterceptors(TransactionInterceptor)
  async create(
    @Body() createMetaDataDto: CreateMetaDataDto,
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
  ) {
    try {
      return await this.metaDataService.create(createMetaDataDto, queryRunner);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to add metadata.');
    }
  }

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
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Something went wrong. Failed to update metadata.',
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.metaDataService.find(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.metaDataService.remove(id);
  }
}
