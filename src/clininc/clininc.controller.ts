import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  Get,
  Req,
  Query,
} from '@nestjs/common';
import { ClinicService } from './clinic.service';
import { CreateClinicDto } from './dto/add-clinic.dto';
import { Clinic } from './entity/clininc.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { QueryRunner } from 'typeorm';
import { TransactionInterceptor } from 'src/transactions/transaction.interceptor';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';
import { Request } from 'src/interfaces/request.interface';
import { UserClinicService } from 'src/user_clinic/user_clinic.service';

@Controller('clinic')
@UseGuards(JwtAuthGuard)
export class ClinicController {
  constructor(
    private readonly clinicService: ClinicService,
    private readonly userClinicService: UserClinicService,
  ) {}

  @Post('')
  @UseInterceptors(TransactionInterceptor)
  async create(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Req() req: Request,
    @Body() createClinicDto: CreateClinicDto,
  ): Promise<Clinic> {
    try {
      const adminId = req?.user?.uid;
      return await this.clinicService.create(
        adminId,
        createClinicDto,
        queryRunner,
      );
    } catch (error) {
      throw error;
    }
  }

  @Get('get')
  async findClinicDetails(@Req() req: Request): Promise<Clinic[]> {
    try {
      const userId = req?.user?.uid;
      return await this.userClinicService.findClinicsOfUser(userId);
    } catch (error) {
      throw error;
    }
  }

  @Get('')
  async findClinic(@Query('id') clinicId: number): Promise<Clinic> {
    try {
      return await this.clinicService.findOne(clinicId);
    } catch (error) {
      throw error;
    }
  }
}
