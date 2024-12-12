import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { MetaDataService } from './meta-data.service';
import { CreateMetaDataDto } from './dto/create-meta-data.dto';
import { UpdateMetaDataDto } from './dto/update-meta-data.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('meta-data')
@UseGuards(JwtAuthGuard)
export class MetaDataController {
  constructor(private readonly metaDataService: MetaDataService) {}

  @Post()
  async create(@Body() createMetaDataDto: CreateMetaDataDto) {
    return this.metaDataService.create(createMetaDataDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMetaDataDto: UpdateMetaDataDto,
  ) {
    return this.metaDataService.update(id, updateMetaDataDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.metaDataService.find(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.metaDataService.remove(id);
  }
}
