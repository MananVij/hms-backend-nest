import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VitalsService } from './vitals.service';
import { VitalsController } from './vitals.controller';
import { Vitals } from './entity/vitals.entity';
import { User } from 'src/user/entity/user.enitiy';
import { ErrorLogModule } from 'src/errorlog/error-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([Vitals, User]), Vitals, ErrorLogModule],
  providers: [VitalsService],
  controllers: [VitalsController],
})
export class VitalsModule {}
