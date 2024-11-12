import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SideBar } from './entity/sidebar.entity';
import { SideBarController } from './sidebar.controller';
import { SideBarService } from './sidebar.service';
import { User } from 'src/user/entity/user.enitiy';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([SideBar])],
  controllers: [SideBarController],
  providers: [SideBarService],
  exports: [SideBarService],
})
export class SidebarModule {}
