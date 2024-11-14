import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { MetaData } from './entity/metadata.entity';
import { MetaDataController } from './meta-data.controller';
import { MetaDataService } from './meta-data.service';
import { User } from '../user/entity/user.enitiy';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([MetaData, User]), UserModule],
  controllers: [MetaDataController],
  providers: [MetaDataService],
  exports: [MetaDataService],
})
export class MetadataModule {}
