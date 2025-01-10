import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserClinic } from './entity/user_clinic.entity';
import { UserClinicService } from './user_clinic.service';
import { ErrorLogModule } from 'src/errorlog/error-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserClinic]), ErrorLogModule],
  providers: [UserClinicService],
  exports: [UserClinicService],
})
export class UserClinicModule {}
