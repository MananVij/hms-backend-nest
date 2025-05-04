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

  async findOne(id: string, queryRunner: QueryRunner): Promise<ReportTemplate> {
    const template = await queryRunner.manager.findOne(ReportTemplate, {
      where: { id },
    });
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return template;
  }

  async getTemplatesByUserRole(
    userId: string,
    clinicId: number,
    queryRunner: QueryRunner,
  ): Promise<ReportTemplate[]> {
    try {
      const userClinic = await queryRunner.manager.findOne(UserClinic, {
        where: { user: { uid: userId }, clinic: { id: clinicId } },
        relations: ['user', 'clinic'],
      });

      if (!userClinic) {
        throw new NotFoundException('User not associated with this clinic');
      }

      // Check if user is a doctor or receptionist
      const isDoctor = userClinic.role.includes(UserRole.DOCTOR);
      const isReceptionist = userClinic.role.includes(UserRole.RECEPTIONIST);

      // If user is a doctor, filter templates by their specialization
      if (isDoctor) {
        const doctor = await queryRunner.manager.findOne(Doctor, {
          where: { user: { uid: userId } },
        });

        if (doctor && doctor.specialization.toLowerCase() === 'cardiologist') {
          return await queryRunner.manager.find(ReportTemplate, {
            where: { type: ReportType.HEART },
          });
        }
      }

      // If user is a receptionist, check if clinic has cardiologists
      if (isReceptionist) {
        const doctorClinicRelations = await queryRunner.manager.find(
          UserClinic,
          {
            where: {
              clinic: { id: clinicId },
              role: ArrayContains([UserRole.DOCTOR]),
            },
            relations: ['user', 'user.doctor'],
          },
        );

        const doctorSpecializations = doctorClinicRelations
          .map((rel) => rel.user?.doctor?.specialization?.toLowerCase())
          .filter((spec) => spec); // Remove nulls/undefined

        if (doctorSpecializations.includes('cardiologist')) {
          return await queryRunner.manager.find(ReportTemplate, {
            where: { type: ReportType.HEART },
          });
        }
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
