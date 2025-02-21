import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { MoreThan, QueryRunner } from 'typeorm';
import { CreateMedicalReportDto } from './dto/create-medical-reports.dto';
import { User } from 'src/user/entity/user.enitiy';
import { MedicalReport } from './entity/medical-reports.entity';
import { FirebaseService } from 'src/firebase/firebase.service';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { ErrorLogService } from 'src/errorlog/error-log.service';
import { ReportAccess } from 'src/report-access/entity/report-access.entity';
import { ShareReportDto } from 'src/report-access/dto/share-report.dto';
import { RevokeAccessDto } from 'src/report-access/dto/revoke-access.dto';

@Injectable()
export class MedicalReportService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly errorLogService: ErrorLogService,
  ) {}

  async uploadFile(
    queryRunner: QueryRunner,
    files: Express.Multer.File[],
    dto: CreateMedicalReportDto,
    uploadedBy: string,
  ): Promise<any> {
    try {
      const folderPath = `reports/${dto.patientId}/${dto.recordType}`;
      const uploadedByUser = await queryRunner.manager.findOne(User, {
        where: { uid: uploadedBy },
      });

      if (!uploadedByUser) throw new NotFoundException('User Not Found');
      if (!files?.length) throw new BadRequestException('File is required');
      let patientFound: User | null = null;
      let doctorFound: Doctor | null = null;
      if (!uploadedByUser.isPatient) {
        const [patient, doctor] = await Promise.all([
          queryRunner.manager.findOne(User, { where: { uid: dto.patientId } }),
          queryRunner.manager.findOne(Doctor, {
            where: { user: { uid: dto.doctorId } },
          }),
        ]);
        if (!patient || !doctor) throw new NotFoundException('User Not Found');
        patientFound = patient;
        doctorFound = doctor;
      } else {
        const patient = await queryRunner.manager.findOne(User, {
          where: { uid: dto.patientId },
        });
        if (!patient) throw new NotFoundException('User Not Found');
      }

      const timestamp = Date.now();
      return Promise.all(
        files.map(async (file) => {
          const url = await this.firebaseService.uploadSingleFile(
            file,
            `${folderPath}/${timestamp}`,
          );
          const medicalReport = queryRunner.manager.create(MedicalReport, {
            ...dto,
            patient: patientFound,
            doctor: doctorFound,
            fileUrl: url,
            uploadedBy: uploadedByUser,
          });
          const savedReport = await queryRunner.manager.save(medicalReport);
          return {
            reportId: savedReport?.reportId,
            recordType: savedReport.recordType,
            comments: savedReport.comments,
            fileUrl: savedReport.fileUrl,
            createdAt: savedReport.createdAt,
          };
        }),
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      await this.errorLogService.logError(
        `Upload error: ${error?.message}`,
        error?.stack,
        null,
        uploadedBy,
        dto?.patientId ?? null,
      );
      throw new InternalServerErrorException(
        'Something went wrong. Please try again later.',
      );
    }
  }

  async shareReport(
    queryRunner: QueryRunner,
    reportId: string,
    patientId: string,
    dto: ShareReportDto,
  ): Promise<void> {
    try {
      const report = await queryRunner.manager.findOne(MedicalReport, {
        where: { reportId },
        relations: ['uploadedBy', 'patient'],
      });

      if (!report) throw new NotFoundException('Report not found');
      if (report.uploadedBy.uid !== patientId)
        throw new ForbiddenException('Not authorized');
      if (!report.uploadedBy.isPatient)
        throw new ForbiddenException('Only patients can share');

      const doctor = await queryRunner.manager.findOne(Doctor, {
        where: { user: { uid: dto.doctorId } },
      });

      if (!doctor) throw new NotFoundException('Doctor not found');

      const access = queryRunner.manager.create(ReportAccess, {
        report,
        doctor,
        expiresAt: dto?.indefinite
          ? null
          : new Date(Date.now() + 30 * 60 * 1000),
      });
      await queryRunner.manager.save(access);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      await this.errorLogService.logError(
        `Error in sharing report: ${error?.message}`,
        error?.stack,
        null,
        dto.doctorId,
        patientId,
      );
      throw new InternalServerErrorException(
        'Something went wrong. Please try again later.',
      );
    }
  }

  async getReport(
    queryRunner: QueryRunner,
    reportId: string,
    userId: string,
  ): Promise<MedicalReport> {
    try {
      const report = await queryRunner.manager.findOne(MedicalReport, {
        where: { reportId },
        relations: ['patient', 'uploadedBy', 'accessGrants.doctor'],
      });

      if (!report) throw new NotFoundException('Report not found');
      if (report.patient.uid === userId || report.uploadedBy.uid === userId)
        return report;

      const doctor = await queryRunner.manager.findOne(Doctor, {
        where: { user: { uid: userId } },
        relations: ['user'],
      });

      if (!doctor) throw new ForbiddenException('Access denied');

      const validAccess = await queryRunner.manager.findOne(ReportAccess, {
        where: [
          {
            report: { reportId },
            doctor: { id: doctor.id },
            expiresAt: null,
          },
          {
            report: { reportId },
            doctor: { id: doctor.id },
            expiresAt: MoreThan(new Date()),
          },
        ],
      });

      if (!validAccess) throw new ForbiddenException('Access expired');

      return report;
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      await this.errorLogService.logError(
        `Error in fetching report: ${error?.message}`,
        error?.stack,
        null,
        null,
        null,
      );
      throw new InternalServerErrorException(
        'Something went wrong. Please try again later.',
      );
    }
  }

  async revokeAccess(
    queryRunner: QueryRunner,
    reportId: string,
    patientId: string,
    dto: RevokeAccessDto,
  ): Promise<void> {
    try {
      const report = await queryRunner.manager.findOne(MedicalReport, {
        where: { reportId },
        relations: ['uploadedBy', 'patient'],
      });

      if (!report) throw new NotFoundException('Report not found');
      if (report.uploadedBy.uid !== patientId)
        throw new ForbiddenException('Not authorized');
      if (!report.uploadedBy.isPatient)
        throw new ForbiddenException('Only patients can revoke access');

      const doctor = await queryRunner.manager.findOne(Doctor, {
        where: { user: { uid: dto.doctorId } },
      });

      if (!doctor) throw new NotFoundException('Doctor not found');

      await queryRunner.manager.delete(ReportAccess, {
        report: { reportId },
        doctor: { id: doctor.id },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      await this.errorLogService.logError(
        `Error in revoking access of report ${error?.mesage}`,
        error?.stack,
        null,
        dto?.doctorId,
        patientId,
      );
      throw new InternalServerErrorException(
        'Something went wrong. Please try again later.',
      );
    }
  }
}
