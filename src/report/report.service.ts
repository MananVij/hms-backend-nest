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
import * as puppeteer from 'puppeteer';
import { FirebaseService } from 'src/firebase/firebase.service';
import { ErrorLogService } from 'src/errorlog/error-log.service';
import { Report } from './report.entity';
import { renderHandlebarsTemplate } from '../utils/handlebars-util';
import { FooterType, UserClinic } from 'src/user_clinic/entity/user_clinic.entity';

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

      // 3. Render HTML
      const padding = userClinic?.reportPadding;
      const renderedContent = renderHandlebarsTemplate(template.content, templateValues);
      const html = `
        <html>
        <head>
          <style>
            @page {
              margin: ${padding?.paddingTop || 0}px ${padding?.paddingRight || 0}px ${padding?.paddingBottom || 0}px ${padding?.paddingLeft || 0}px;
            }
            body {
              margin: 0;
              font-family: Arial, sans-serif;
            }
          </style>
        </head>
        <body>
          ${renderedContent}
        </body>
        </html>
      `;

      // 4. Generate PDF (pass header/footer images)
      const pdfBuffer = await this.generatePdf(html, headerImage, footerType, footerContent);

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

  private async generatePdf(html: string, headerImage?: string | null, footerType?: FooterType | null, footerContent?: string | null): Promise<Buffer> {
    try {
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();

      const headerHtml = headerImage
        ? `<div style="margin:0;padding:0;width:100%;">
            <img src="${headerImage}" alt="Header Image" style="width:100%;max-width:100%;height:auto;display:block;object-fit:contain;margin:0;padding:0;" />
          </div>`
        : '';
      let footerHtml = '';
      if (footerType === FooterType.IMAGE && footerContent) {
        footerHtml = `<div style="margin:0;padding:0;width:100%;">
            <img src="${footerContent}" alt="Footer Image" style="width:100%;max-width:100%;height:auto;display:block;object-fit:contain;margin:0;padding:0;" />
          </div>`;
      } else if (footerType === FooterType.TEXT && footerContent) {
        footerHtml = `<div style="width:100%;border-top:1px solid #888;padding-top:6px;text-align:center;font-size:12px;margin:0;margin-bottom:0;padding-bottom:0;">${footerContent}</div>`;
      }
      
      const fullHtml = `
        <html>
        <head>
          <style>
            @page {
              margin-top: ${headerImage ? '60px' : '0px'};
              margin-bottom: ${(footerType === FooterType.IMAGE || footerType === FooterType.TEXT) ? '60px' : '0px'};
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
        </html>
      `;
      
      await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
      
      // Generate PDF with the same configuration as frontend
      const pdfUint8Array = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: headerHtml,
        footerTemplate: footerHtml,
        margin: { 
          top: headerImage ? '60px' : '0', 
          bottom: (footerType === FooterType.IMAGE || footerType === FooterType.TEXT) ? '60px' : '0',
          left: '0',
          right: '0'
        }
      });
      
      await browser.close();
      return Buffer.isBuffer(pdfUint8Array) ? pdfUint8Array : Buffer.from(pdfUint8Array);
    } catch (error) {
      await this.errorLogService.logError(
        `Error generating PDF: ${error.message}`,
        error.stack || '',
        undefined,
        undefined,
        undefined,
      );
      throw new ReportServiceError(error.message || 'Error generating PDF');
    }
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
