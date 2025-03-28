import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { MetaData } from './entity/metadata.entity';
import { CreateMetaDataDto } from './dto/create-meta-data.dto';
import { UpdateMetaDataDto } from './dto/update-meta-data.dto';
import { User } from 'src/user/entity/user.enitiy';
import { ErrorLogService } from 'src/errorlog/error-log.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class MetaDataService {
  constructor(
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

      const metaData = queryRunner.manager.create(MetaData, {
        ...createMetaDataDto,
        user,
      });

      const savedMetaData = await queryRunner.manager.save(metaData);
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
      throw new InternalServerErrorException(
        'Unable to create metadata. Something went wrong',
      );
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
        relations: ['user'],
        select: {
          user: {
            name: true,
          },
        },
      });
      if (!metaData) {
        throw new InternalServerErrorException('Meta data of user not found');
      }
      if (updateMetaDataDto.name) {
        metaData.user.name = updateMetaDataDto.name;
        await queryRunner.manager.update(
          User,
          { uid: id },
          { name: updateMetaDataDto.name },
        );
      }
      Object.assign(metaData, updateMetaDataDto);

      return await queryRunner.manager.save(metaData);
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      await this.errorLogService.logError(
        `Error in updating metadata: ${error.message}`,
        error.stack,
        null,
        null,
        id,
      );
      throw new InternalServerErrorException(
        'Something Went Wrong. Unable to update metadata.',
      );
    }
  }
}
