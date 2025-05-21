import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrescriptionTemplate } from './entity/prescription-template.entity';
import { PrescriptionTemplateService } from './prescription-template.service';
import { PrescriptionTemplateController } from './prescription-template.controller';
import { ErrorLogModule } from 'src/errorlog/error-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([PrescriptionTemplate]), ErrorLogModule],
  controllers: [PrescriptionTemplateController],
  providers: [PrescriptionTemplateService],
  exports: [PrescriptionTemplateService],
})
export class PrescriptionTemplateModule {}



