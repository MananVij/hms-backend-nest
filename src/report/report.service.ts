import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { CreateReportDto } from './create-report.dto';
import { ReportTemplate } from 'src/report_template/report-template.entity';
import { VariableDto } from 'src/report_template/variable.dto';
import { Clinic } from 'src/clininc/entity/clininc.entity';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { User } from 'src/user/entity/user.enitiy';
import { FirebaseService } from 'src/firebase/firebase.service';
import { ErrorLogService } from 'src/errorlog/error-log.service';
import { Report } from './report.entity';
import { renderHandlebarsTemplate } from '../utils/handlebars-util';
import { UserClinic } from 'src/user_clinic/entity/user_clinic.entity';
import { LambdaPdfService } from './lambda-pdf.service';

function getAgeFromDOB(dob: Date | string): string {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age.toString();
}

// Custom error class for propagating error messages
class ReportServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportServiceError';
  }
}

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(ReportTemplate)
    private templateRepo: Repository<ReportTemplate>,
    @InjectRepository(Report) private reportRepo: Repository<Report>,
    @InjectRepository(Doctor) private doctorRepo: Repository<Doctor>,
    @InjectRepository(Clinic) private clinicRepo: Repository<Clinic>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(UserClinic) private userClinicRepo: Repository<UserClinic>,
    private readonly firebaseService: FirebaseService,
    private readonly errorLogService: ErrorLogService,
    private readonly lambdaPdfService: LambdaPdfService,
  ) {}

  async createReport(dto: CreateReportDto, queryRunner: QueryRunner) {
    try {
      // 1. Fetch all required entities
      const { template, doctor, clinic, patient } = await this.fetchEntities(dto);

      // Fetch UserClinic for header/footer images
      const userClinic = await this.userClinicRepo.findOne({
        where: { user: { uid: dto.doctorId }, clinic: { id: dto.clinicId } },
      });
      const headerImage = userClinic?.reportHeaderImage;
      const footerType = userClinic?.reportFooterType;
      const footerContent = userClinic?.reportFooterContent;

      // 2. Prepare values for the template
      const filteredValues = this.filterIgnoredVariables(template.variables, dto.values);
      const templateValues = this.prepareTemplateValues(patient, filteredValues);
      const padding = userClinic?.reportPadding;
      const renderedContent = renderHandlebarsTemplate(template.content, templateValues);
      const html = `
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            @page {
              margin: ${padding?.paddingTop || 0}px ${padding?.paddingRight || 0}px ${padding?.paddingBottom || 0}px ${padding?.paddingLeft || 0}px;
            }
            * {
              font-family: 'Inter', 'DejaVu Sans', 'Liberation Sans', Arial, sans-serif !important;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            body {
              margin: 0;
              font-family: 'Inter', 'DejaVu Sans', 'Liberation Sans', Arial, sans-serif !important;
              font-size: 14px;
              line-height: 1.4;
              color: #000;
            }
            table {
              font-family: 'Inter', 'DejaVu Sans', 'Liberation Sans', Arial, sans-serif !important;
            }
            td, th, p, div, span {
              font-family: 'Inter', 'DejaVu Sans', 'Liberation Sans', Arial, sans-serif !important;
            }
          </style>
        </head>
        <body>
          ${renderedContent}
        </body>
        </html>
      `;
      // 4. Generate PDF via Lambda
      let pdfBuffer: Buffer;
      try {
        pdfBuffer = await this.lambdaPdfService.generatePdf(html, headerImage, footerType, footerContent);
      } catch (lambdaError) {
        await this.errorLogService.logError(
          `Lambda PDF generation failed: ${lambdaError.message}`,
          lambdaError.stack || '',
          undefined,
          dto.doctorId,
          dto.patientId,
        );
        throw new ReportServiceError(`PDF generation failed: ${lambdaError.message}`);
      }

      // 5. Upload PDF
      const pdfUrl = await this.uploadPdfToFirebase(pdfBuffer, template, dto);

      // 6. Save report
      return await this.saveReport({ template, doctor, clinic, patient, filteredValues, pdfUrl }, queryRunner);
    } catch (error) {
      const message = error instanceof ReportServiceError ? error.message : 'Failed to create report';
      await this.errorLogService.logError(
        `Error in createReport: ${error.message}`,
        error.stack || '',
        undefined,
        dto.doctorId,
        dto.patientId,
      );
      throw new InternalServerErrorException(message);
    }
  }

  private async fetchEntities(dto: CreateReportDto): Promise<{
    template: ReportTemplate;
    doctor: Doctor;
    clinic: Clinic;
    patient: User;
  }> {
    try {
      const [template, doctor, clinic, patient] = await Promise.all([
        this.templateRepo.findOne({ where: { id: dto.templateId } }),
        this.doctorRepo.findOne({ where: { user: { uid: dto.doctorId } }, relations: ['user'] }),
        this.clinicRepo.findOne({ where: { id: dto.clinicId } }),
        this.userRepo.findOne({ where: { uid: dto.patientId }, relations: ['metaData'] }),
      ]);
      if (!template) throw new ReportServiceError('Template not found');
      if (!doctor) throw new ReportServiceError('Doctor not found');
      if (!clinic) throw new ReportServiceError('Clinic not found');
      if (!patient) throw new ReportServiceError('Patient not found');
      return { template, doctor, clinic, patient };
    } catch (error) {
      await this.errorLogService.logError(
        `Error in fetchEntities: ${error.message}`,
        error.stack || '',
        undefined,
        dto.doctorId,
        dto.patientId,
      );
      throw new ReportServiceError(error.message || 'Failed to fetch report entities');
    }
  }

  private prepareTemplateValues(
    patient: User,
    filteredValues: Record<string, string | null>
  ): Record<string, any> {
    const patientDetails = {
      patientId: patient.publicIdentifier || '',
      name: patient.name || '',
      age: patient.metaData?.dob ? getAgeFromDOB(patient.metaData.dob) : '',
      sex: patient.metaData?.sex || '',
    };
    return {
      ...patientDetails,
      ...filteredValues,
      date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    };
  }

  private async uploadPdfToFirebase(
    pdfBuffer: Buffer,
    template: ReportTemplate,
    dto: CreateReportDto
  ): Promise<string> {
    try {
      const fileName = `reports/${dto.patientId}/${template.subtype}/$${Date.now()}.pdf`;
      const file: Express.Multer.File = {
        buffer: pdfBuffer,
        originalname: `${template.title || 'report'}-${Date.now()}.pdf`,
        mimetype: 'application/pdf',
        size: pdfBuffer.length,
        encoding: '7bit',
        fieldname: 'file',
        stream: undefined,
        destination: '',
        filename: '',
        path: '',
      };
      return await this.firebaseService.uploadSingleFile(file, fileName);
    } catch (error) {
      await this.errorLogService.logError(
        `Error uploading PDF: ${error.message}`,
        error.stack || '',
        undefined,
        dto.doctorId,
        dto.patientId,
      );
      throw new ReportServiceError(error.message || 'Error uploading PDF');
    }
  }

  private async saveReport(
    {
      template,
      doctor,
      clinic,
      patient,
      filteredValues,
      pdfUrl,
    }: {
      template: ReportTemplate;
      doctor: Doctor;
      clinic: Clinic;
      patient: User;
      filteredValues: Record<string, string | null>;
      pdfUrl: string;
    },
    queryRunner: QueryRunner
  ) {
    try {
      const report = this.reportRepo.create({
        template,
        patient,
        doctor,
        clinic,
        values: filteredValues,
        pdfUrl,
      });
      await queryRunner.startTransaction();
      const savedReport = await queryRunner.manager.save(report);
      await queryRunner.commitTransaction();
      return savedReport;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await this.errorLogService.logError(
        `Error saving report: ${error.message}`,
        error.stack || '',
        undefined,
        doctor?.user?.uid,
        patient?.uid,
      );
      throw new ReportServiceError(error.message || 'Error saving report');
    }
  }

  private filterIgnoredVariables(
    variables: VariableDto[],
    values: Record<string, string | null>,
  ) {
    const filtered: Record<string, string | null> = {};
    variables.forEach((v) => {
      if (!v.ignore) filtered[v.key] = values[v.key] ?? null;
    });
    return filtered;
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
}
