import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportAccess } from './entity/report-access.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReportAccess])],
  exports: [TypeOrmModule],
})
export class ReportAccessModule {}
