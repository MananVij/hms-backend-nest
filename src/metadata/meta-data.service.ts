import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { MetaData } from './entity/metadata.entity';
import { CreateMetaDataDto } from './dto/create-meta-data.dto';
import { UpdateMetaDataDto } from './dto/update-meta-data.dto';
import { User } from 'src/user/entity/user.enitiy';
import { ErrorLogService } from 'src/errorlog/error-log.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class MetaDataService {
  constructor(
    @InjectRepository(MetaData)
    private metaDataRepository: Repository<MetaData>,

    private readonly userService: UserService,
    private readonly errorLogService: ErrorLogService,
  ) {}

  async create(
    createMetaDataDto: CreateMetaDataDto,
    queryRunner: QueryRunner,
  ): Promise<MetaData> {
    const { uid } = createMetaDataDto;
    try {
      const user = await queryRunner.manager.findOne(User, { where: { uid } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const metaDataRepo = queryRunner.manager.getRepository(MetaData);
      const metaData = metaDataRepo.create({
        ...createMetaDataDto,
        user,
      });

      const savedMetaData = await metaDataRepo.save(metaData);
      await this.userService.updateMetaData(
        user.uid,
        savedMetaData,
        queryRunner,
      );
      return savedMetaData;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      await this.errorLogService.logError(
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
    queryRunner: QueryRunner,
  ): Promise<MetaData> {
    try {
      const metaData = await queryRunner.manager.findOne(MetaData, {
        where: { user: { uid: id } },
      });
      if (!metaData) {
        throw new NotFoundException('Meta data of user not found');
      }
      if (!metaData) {
        return null;
      }
      Object.assign(metaData, updateMetaDataDto);

      return await queryRunner.manager.save(metaData);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      await this.errorLogService.logError(
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
      await this.errorLogService.logError(
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
