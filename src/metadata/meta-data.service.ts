import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetaData } from './entity/metadata.entity';
import { CreateMetaDataDto } from './dto/create-meta-data.dto';
import { UpdateMetaDataDto } from './dto/update-meta-data.dto';
import { User } from 'src/user/entity/user.enitiy';
import { ErrorLogService } from 'src/errorlog/error-log.service';

@Injectable()
export class MetaDataService {
  constructor(
    @InjectRepository(MetaData)
    private metaDataRepository: Repository<MetaData>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private readonly errorLogRepository: ErrorLogService,
  ) {}

  // Create new meta-data entry
  async create(createMetaDataDto: CreateMetaDataDto): Promise<MetaData> {
    try {
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
      await this.userRepository.update(user.uid, { metaData: savedMetaData });
      return savedMetaData;
    } catch (error) {
      await this.errorLogRepository.logError(
        `Error in creating metadata: ${error.message}`,
        error.stack,
        null,
        null,
        createMetaDataDto?.uid,
      );
      throw Error('Something Went Wrong');
    }
  }

  // Update an existing meta-data entry
  async update(
    id: string,
    updateMetaDataDto: UpdateMetaDataDto,
  ): Promise<MetaData> {
    try {
      const metaData = await this.metaDataRepository.findOne({
        where: { user: { uid: id } },
      });
      if (!metaData) {
        return null;
      }
      Object.assign(metaData, updateMetaDataDto);

      return this.metaDataRepository.save(metaData);
    } catch (error) {
      await this.errorLogRepository.logError(
        `Error in updating metadata: ${error.message}`,
        error.stack,
        null,
        null,
        id,
      );
      throw Error('Something Went Wrong');
    }
  }

  // Retrieve a specific meta-data entry by ID
  async find(id: string): Promise<any> {
    try {
      const metaData = await this.metaDataRepository.findOne({
        where: { user: { uid: id } },
        relations: ['user'],
      });
      if (!metaData) {
        return null;
      }
      const { user, ...metaDataWihoutUser } = metaData;
      return { ...metaDataWihoutUser, name: metaData.user.name };
    } catch (error) {
      await this.errorLogRepository.logError(
        `Error in updating metadata: ${error.message}`,
        error.stack,
        null,
        null,
        id,
      );
      throw Error('Something Went Wrong');
    }
  }

  // Delete a meta-data entry by ID
  async remove(id: string): Promise<void> {
    const result = await this.metaDataRepository.delete({ user: { uid: id } });

    if (result.affected === 0) {
      throw new NotFoundException('Meta-data not found');
    }
  }
}
