import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from './entity/contact.entity';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { User } from '../user/entity/user.enitiy';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Contact, User]), UserModule],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
