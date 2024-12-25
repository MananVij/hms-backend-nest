import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ClinicService } from './clinic.service';
import { CreateClinicDto } from './dto/add-clinic.dto';
import { Clinic } from './entity/clininc.entity';
import { UpdateClinicDto } from './dto/update-clininc.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('clinic')
@UseGuards(JwtAuthGuard)
export class ClinicController {
  constructor(private readonly clinicService: ClinicService) {}

  @Post('create')
  create(@Body() createClinicDto: CreateClinicDto) {
    return this.clinicService.create(createClinicDto);
  }

  @Get('get')
  findClinicDetails(
    @Query('clinicIds') clinicIdArray: number[],
  ): Promise<Clinic[]> {
    return this.clinicService.findAllByClinicIds(clinicIdArray);
  }

  @Get('')
  findOne(@Query('id') id: number) {
    return this.clinicService.findOne(id);
  }

  @Put(':id') // Updates a specific clinic by ID
  update(@Param('id') id: number, @Body() updateClinicDto: UpdateClinicDto) {
    return this.clinicService.update(id, updateClinicDto);
  }

  @Delete(':id') // Deletes a specific clinic by ID
  remove(@Param('id') id: number) {
    return this.clinicService.remove(id);
  }
}
