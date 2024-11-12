import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SideBar } from './entity/sidebar.entity';
import { CreateSidebarDto } from './dto/create-sidebar.dto';

@Injectable()
export class SideBarService {
  constructor(
    @InjectRepository(SideBar)
    private readonly sidebarRepository: Repository<SideBar>,
  ) {}

  async create(createSidebarDto: CreateSidebarDto) {
    const sidebar = this.sidebarRepository.create(createSidebarDto)
    return this,this.sidebarRepository.save(sidebar)
  }

  async getSideBarItemsForRole(role: string): Promise<SideBar[]> {
    // Fetch sidebar items that match the user's role and sort them by index
    return this.sidebarRepository
      .createQueryBuilder('sidebar')
      .where(':role = ANY(sidebar.roles)', { role })
      .orderBy('sidebar.index', 'ASC') // Sort by index in ascending order
      .getMany();
  }
}
