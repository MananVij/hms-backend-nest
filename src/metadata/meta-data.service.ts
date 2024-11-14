import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetaData } from './entity/metadata.entity';
import { CreateMetaDataDto } from './dto/create-meta-data.dto';
import { UpdateMetaDataDto } from './dto/update-meta-data.dto';
import { User } from '../user/entity/user.enitiy';

@Injectable()
export class MetaDataService {
  constructor(
    @InjectRepository(MetaData)
    private metaDataRepository: Repository<MetaData>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Create new meta-data entry
  async create(createMetaDataDto: CreateMetaDataDto): Promise<MetaData> {
    const { uid } = createMetaDataDto;

    // Find the user by uid to link with meta-data
    const user = await this.userRepository.findOne({ where: { uid } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const metaData = this.metaDataRepository.create({
      ...createMetaDataDto,
      user, // linking the meta-data to the user
    });

    const savedMetaData = await this.metaDataRepository.save(metaData);
    user.metaData = savedMetaData;
    await this.userRepository.save(user);
    return savedMetaData;
  }

  // Update an existing meta-data entry
  async update(
    id: string,
    updateMetaDataDto: UpdateMetaDataDto,
  ): Promise<MetaData> {
    const metaData = await this.metaDataRepository.findOne({
      where: { user: { uid: id } },
    });
    if (!metaData) {
      throw new NotFoundException('Meta-data not found');
    }

    Object.assign(metaData, updateMetaDataDto); // Merge update DTO fields into the meta-data entity

    return this.metaDataRepository.save(metaData);
  }

  // Retrieve a specific meta-data entry by ID
  async find(id: string): Promise<any> {
    const metaData = await this.metaDataRepository.findOne({
      where: { user: { uid: id } },
      relations: ['user'],
    });
    if (!metaData) {
      throw new NotFoundException('Meta-data not found');
    }
    const { user, ...metaDataWihoutUser } = metaData;
    return { ...metaDataWihoutUser, name: metaData.user.name };
  }

  // Delete a meta-data entry by ID
  async remove(id: string): Promise<void> {
    const result = await this.metaDataRepository.delete({ user: { uid: id } });

    if (result.affected === 0) {
      throw new NotFoundException('Meta-data not found');
    }
  }
}
