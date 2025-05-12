import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportTemplateController } from './report-template.controller';
import { ReportTemplateService } from './report-template.service';
import { ReportTemplate } from './report-template.entity';
import { ErrorLogModule } from 'src/errorlog/error-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([ReportTemplate]), ErrorLogModule],
  controllers: [ReportTemplateController],
  providers: [ReportTemplateService],
  exports: [ReportTemplateService],
})
export class ReportTemplateModule {}
