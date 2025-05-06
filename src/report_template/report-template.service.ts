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

  async findAll(queryRunner: QueryRunner): Promise<ReportTemplate[]> {
    try {
      return await queryRunner.manager.find(ReportTemplate);
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve templates.');
    }
  }

  async findOneWithPadding(templateId: string, doctorId: string, clinicId: number, queryRunner: QueryRunner) {
    const template = await queryRunner.manager.findOne(ReportTemplate, { where: { id: templateId } });
    const userClinic = await queryRunner.manager.findOne(UserClinic, {
      where: { user: { uid: doctorId }, clinic: { id: clinicId } }
    });
    return {
      ...template,
      reportPadding: userClinic?.reportPadding || null,
    };
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
        undefined, // No audio URL
        undefined, // No doctor context
        userId, // Patient/user context
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
