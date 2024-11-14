import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SideBar } from './entity/sidebar.entity';
import { SideBarController } from './sidebar.controller';
import { SideBarService } from './sidebar.service';

@Module({
  imports: [TypeOrmModule.forFeature([SideBar])],
  controllers: [SideBarController],
  providers: [SideBarService],
  exports: [SideBarService],
})
export class SidebarModule {}
