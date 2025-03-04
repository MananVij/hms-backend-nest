import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.enitiy';
import { UserClinicModule } from 'src/user_clinic/user_clinic.module';
import { ErrorLogModule } from 'src/errorlog/error-log.module';
import { PublicIdentifierService } from './public-identifier.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), UserClinicModule, ErrorLogModule],
  controllers: [UserController],
  providers: [UserService, PublicIdentifierService],
  exports: [UserService],
})
export class UserModule {}
