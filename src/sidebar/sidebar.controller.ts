import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { SideBarService } from './sidebar.service';
import { SideBar } from './entity/sidebar.entity';
import { CreateSidebarDto } from './dto/create-sidebar.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('sidebar')
export class SideBarController {
  constructor(private readonly sidebarService: SideBarService) {}

  @Post()
  async create(@Body() sidebarDto: CreateSidebarDto) {
    return this.sidebarService.create(sidebarDto)

  }

  @UseGuards(JwtAuthGuard)
  @Get(':role')
  async getSidebarItems(@Param('role') role: string): Promise<SideBar[]> {
    return this.sidebarService.getSideBarItemsForRole(role);
  }
}
