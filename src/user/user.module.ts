import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.enitiy';
import { PatientClinic } from 'src/patient_clinic/entity/patient_clinic.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PatientClinic]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
