import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetaData } from './entity/metadata.entity';
import { MetaDataController } from './meta-data.controller';
import { MetaDataService } from './meta-data.service';
import { ErrorLogModule } from 'src/errorlog/error-log.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MetaData]),
    UserModule,
    ErrorLogModule,
  ],
  controllers: [MetaDataController],
  providers: [MetaDataService],
  exports: [MetaDataService],
})
export class MetadataModule {}
