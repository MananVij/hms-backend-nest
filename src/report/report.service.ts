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
    private readonly firebaseService: FirebaseService,
    private readonly errorLogService: ErrorLogService,
  ) {}

  async createReport(dto: CreateReportDto, queryRunner: QueryRunner) {
    try {
      // 1. Fetch all required entities
      const { template, doctor, clinic, patient } = await this.fetchEntities(dto);

      // 2. Prepare values for the template
      const filteredValues = this.filterIgnoredVariables(template.variables, dto.values);
      const templateValues = this.prepareTemplateValues(patient, filteredValues);

      // 3. Render HTML
      const html = renderHandlebarsTemplate(template.content, templateValues);

      // 4. Generate PDF
      const pdfBuffer = await this.generatePdf(html);

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
      patientId: patient.publicIdentifier,
      name: patient.name,
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

  private async generatePdf(html: string): Promise<Buffer> {
    try {
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfUint8Array = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: `<div style='width:100%;text-align:center;'><img alt='Header Image' style='height:40px;'/></div>`,
        footerTemplate: `<div style='width:100%;text-align:center;'><img alt='Footer Image' style='height:40px;'/></div>`,
        margin: { top: '60px', bottom: '60px' },
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
      const fileName = `reports/${dto.clinicId}/${dto.doctorId}/${dto.patientId}/${Date.now()}.pdf`;
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
}
