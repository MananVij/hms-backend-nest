import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { PrescriptionTemplate } from './entity/prescription-template.entity';
import {
  CreatePrescriptionTemplateDto,
  UpdatePrescriptionTemplateDto,
} from './dto/prescription-template.dto';
import { Doctor } from '../doctor/entity/doctor.entity';
import { ErrorLogService } from '../errorlog/error-log.service';
import { PrescriptionValidator } from 'src/validation/validation-util';

@Injectable()
export class PrescriptionTemplateService {
  constructor(
    @InjectRepository(PrescriptionTemplate)
    private templateRepository: Repository<PrescriptionTemplate>,
    private readonly errorLogService: ErrorLogService,
  ) {}

  async create(
    queryRunner: QueryRunner,
    dto: CreatePrescriptionTemplateDto,
    userId: string,
  ): Promise<PrescriptionTemplate> {
    try {
      const doctor = await queryRunner.manager.findOne(Doctor, {
        where: { user: { uid: userId } },
      });

      if (!doctor) {
        throw new NotFoundException('Doctor not found');
      }

      // If this is the default template, unset any existing default
      if (dto.isDefault) {
        await queryRunner.manager.update(
          PrescriptionTemplate,
          { doctor: { id: doctor.id }, isDefault: true },
          { isDefault: false },
        );
      }

      const validatedTemplate = PrescriptionValidator.validatePrescriptionData(
        dto.data,
      );

      const template = queryRunner.manager.create(PrescriptionTemplate, {
        ...dto,
        data: validatedTemplate,
        doctor,
      });

      return await queryRunner.manager.save(template);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      await this.errorLogService.logError(
        `Error in create prescription template: ${error.message}`,
        error.stack,
        null,
        userId,
      );
      throw new InternalServerErrorException(
        'Error while creating prescription template. Please try again later.',
      );
    }
  }

  async findAll(
    queryRunner: QueryRunner,
    userId: string,
  ): Promise<PrescriptionTemplate[]> {
    try {
      const doctor = await queryRunner.manager.findOne(Doctor, {
        where: { user: { uid: userId } },
      });

      if (!doctor) {
        throw new NotFoundException('Doctor not found');
      }

      // dont return doctor details
      return await queryRunner.manager.find(PrescriptionTemplate, {
        where: { doctor: { id: doctor.id } },
        order: { isDefault: 'DESC', updatedAt: 'DESC' },
        select: {
          isDefault: true,
          id: true,
          name: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      await this.errorLogService.logError(
        `Error in findAll prescription templates: ${error.message}`,
        error.stack,
        null,
        userId,
      );
      throw new InternalServerErrorException(
        'Error while fetching prescription templates. Please try again later.',
      );
    }
  }

  async findOne(
    queryRunner: QueryRunner,
    id: string,
    userId: string,
  ): Promise<PrescriptionTemplate> {
    try {
      const doctor = await queryRunner.manager.findOne(Doctor, {
        where: { user: { uid: userId } },
      });

      if (!doctor) {
        throw new NotFoundException('Doctor not found');
      }

      const template = await queryRunner.manager.findOne(PrescriptionTemplate, {
        where: { id, doctor: { id: doctor.id } },
      });

      if (!template) {
        throw new NotFoundException('Template not found');
      }

      return template;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      await this.errorLogService.logError(
        `Error in findOne prescription template: ${error.message}`,
        error.stack,
        null,
        userId,
      );
      throw new InternalServerErrorException(
        'Error while fetching prescription template. Please try again later.',
      );
    }
  }

  async update(
    queryRunner: QueryRunner,
    id: string,
    dto: UpdatePrescriptionTemplateDto,
    userId: string,
  ): Promise<PrescriptionTemplate> {
    try {
      const template = await this.findOne(queryRunner, id, userId);
      const validatedTemplate =  PrescriptionValidator.validatePrescriptionData(dto.data);
      // If this is being set as default, unset any existing default
      if (dto.isDefault && !template.isDefault) {
        await this.templateRepository.update(
          { doctor: { id: template.doctor.id }, isDefault: true },
          { isDefault: false },
        );
      }

      Object.assign(template, { ...dto, data: validatedTemplate });
      return await this.templateRepository.save(template);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      await this.errorLogService.logError(
        `Error in update prescription template: ${error.message}`,
        error.stack,
        null,
        userId,
      );
      throw new InternalServerErrorException(
        'Error while updating prescription template. Please try again later.',
      );
    }
  }

  async remove(
    queryRunner: QueryRunner,
    id: string,
    userId: string,
  ): Promise<void> {
    try {
      const template = await this.findOne(queryRunner, id, userId);
      await queryRunner.manager.remove(template);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      await this.errorLogService.logError(
        `Error in remove prescription template: ${error.message}`,
        error.stack,
        null,
        userId,
      );
      throw new InternalServerErrorException(
        'Error while removing prescription template. Please try again later.',
      );
    }
  }

  async updateDefault(
    queryRunner: QueryRunner,
    id: string,
    userId: string,
  ): Promise<PrescriptionTemplate> {
    try {
      const template = await this.findOne(queryRunner, id, userId);
      if (template.isDefault) {
        template.isDefault = false;
        return await queryRunner.manager.save(template);
      }

      // Unset any existing default
      await queryRunner.manager.update(
        PrescriptionTemplate,
        { doctor: { id: template.doctor.id }, isDefault: true },
        { isDefault: false },
      );

      // Set this template as default
      template.isDefault = true;
      return await queryRunner.manager.save(template);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      await this.errorLogService.logError(
        `Error in setDefault prescription template: ${error.message}`,
        error.stack,
        null,
        userId,
      );
      throw new InternalServerErrorException(
        'Error while setting default prescription template. Please try again later.',
      );
    }
  }
}
