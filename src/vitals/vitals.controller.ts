import { Controller, Post, Body, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { VitalsService } from './vitals.service';
import { CreateVitalsDto } from './dto/create-vitals.dto';
import { Vitals } from './entity/vitals.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('vitals')
@UseGuards(JwtAuthGuard)
export class VitalsController {
  constructor(private readonly vitalsService: VitalsService) {}

  @Post()
  async createVitals(
    @Body() createVitalsDto: CreateVitalsDto,
  ): Promise<any> {
    return this.vitalsService.createVitals(createVitalsDto);
  }

  @Get(':prescriptionId')
  async getVitalsByPrescription(
    @Param('prescriptionId') prescriptionId: number,
  ): Promise<Vitals[]> {
    return this.vitalsService.getVitalsByPrescription(prescriptionId);
  }

  @Patch(':id')
  async updateVitals(
    @Param('id') id: number,
    @Body() updateVitalsDto: Partial<CreateVitalsDto>,
  ): Promise<Vitals> {
    return this.vitalsService.updateVitals(id, updateVitalsDto);
  }

  @Get('/latest/:userId')
  async getLatestVitalsByUser(
    @Param('userId') userId: string,
  ): Promise<Vitals> {
    return this.vitalsService.getLatestVitalsByUser(userId);
  }
}
