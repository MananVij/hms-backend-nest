import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserClinic } from './entity/user_clinic.entity';
import { UserClinicService } from './user_clinic.service';
import { ErrorLogModule } from 'src/errorlog/error-log.module';
import { UserClinicController } from './user_clinic.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserClinic]), ErrorLogModule],
  providers: [UserClinicService],
  controllers: [UserClinicController],
  exports: [UserClinicService],
})
export class UserClinicModule {}
