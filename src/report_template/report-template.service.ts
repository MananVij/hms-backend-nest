import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner, ArrayContains } from 'typeorm';
import { CreateReportTemplateDto } from './create-report-template.dto';
import { ReportTemplate } from './report-template.entity';
import {
  UserClinic,
  UserRole,
} from 'src/user_clinic/entity/user_clinic.entity';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { ReportType } from './report-template.enum';
import { ErrorLogService } from 'src/errorlog/error-log.service';

@Injectable()
export class ReportTemplateService {
  constructor(
    private readonly errorLogService: ErrorLogService,
    @InjectRepository(ReportTemplate)
    private templateRepo: Repository<ReportTemplate>,
  ) {}

  // Create Report Template with QueryRunner
  async createTemplate(
    dto: CreateReportTemplateDto,
    queryRunner: QueryRunner,
  ): Promise<ReportTemplate> {
    const template = this.templateRepo.create(dto);

    try {
      await queryRunner.manager.save(template);
      return template;
    } catch (error) {
      throw new InternalServerErrorException('Failed to create template.');
    }
  }

  async findOneWithPadding(templateId: string, doctorId: string, clinicId: number, queryRunner: QueryRunner) {
    try {
      const template = await queryRunner.manager.findOne(ReportTemplate, { where: { id: templateId } });
      if (!template) {
        throw new NotFoundException('Template not found.');
    }
    const userClinic = await queryRunner.manager.findOne(UserClinic, {
      where: { user: { uid: doctorId }, clinic: { id: clinicId }, role: ArrayContains([UserRole.DOCTOR]) }
    });
    if (!userClinic) {
      throw new NotFoundException('Doctor not found in clinic.');
    }
    return {
      ...template,
        reportPadding: userClinic?.reportPadding || null,
      };
    } catch (error) {
      await this.errorLogService.logError(
        `Error fetching template: ${error.message}`,
        error.stack || '',
        null,
        doctorId,
        null,
      );
      throw new InternalServerErrorException('Failed to retrieve template.');
    }
  }

  async getTemplatesByDoctor(
    userId: string,
    queryRunner: QueryRunner,
  ): Promise<ReportTemplate[]> {
    try {

      const doctor = await queryRunner.manager.findOne(Doctor, {
        where: { user: { uid: userId } },
      });

      if (doctor && doctor.specialization.toLowerCase() === 'cardiologist') {
        return await queryRunner.manager.find(ReportTemplate, {
          where: { type: ReportType.HEART },
        });
      }

      return [];
    } catch (error) {
      // Log the error with context
      await this.errorLogService.logError(
        `Error fetching templates by user role: ${error.message}`,
        error.stack || '',
        null,
        userId,
        null,
      );

      // Handle different types of errors
      if (error instanceof NotFoundException) {
        throw error; // Rethrow NotFoundException as is
      }
      
      // For database or unexpected errors, throw a generic InternalServerErrorException
      throw new InternalServerErrorException(
        'Failed to retrieve templates. Please try again later.'
      );
    }
  }
}
