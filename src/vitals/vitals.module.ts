import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VitalsService } from './vitals.service';
import { VitalsController } from './vitals.controller';
import { Vitals } from './entity/vitals.entity';
import { User } from '../user/entity/user.enitiy';

@Module({
  imports: [TypeOrmModule.forFeature([Vitals, User]), Vitals],
  providers: [VitalsService],
  controllers: [VitalsController],
})
export class VitalsModule {}
