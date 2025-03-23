import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import { ErrorLogService } from 'src/errorlog/error-log.service';
import { promisify } from 'util';
import * as muhammara from 'muhammara';
import { Readable } from 'stream';
import { QueryRunner } from 'typeorm';
import { User } from 'src/user/entity/user.enitiy';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { UserClinic } from 'src/user_clinic/entity/user_clinic.entity';
const writeFile = promisify(fs.writeFile);

@Injectable()
export class FirebaseService {
  private bucket: admin.storage.Storage;

  constructor(private readonly errorLogService: ErrorLogService) {
    if (!admin.apps.length) {
      const serviceFilePath = path.join(
        process.cwd(),
        'src',
        'serviceAccountKey.json',
      );
      const serviceAccountPath = path.resolve(serviceFilePath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    }

    this.bucket = admin.storage();
  }

  async uploadFiles(
    queryRunner: QueryRunner,
    files: Express.Multer.File[],
    doctor: string,
    patient: string,
    clinicId: number,
  ): Promise<{ pres_url: string; audio_url: string }> {
    try {
      const folderPath = `prescription_data/${doctor}/${patient}`;
      const pdfFile = files.find((file) => file.mimetype === 'application/pdf');
      const audioFile = files.find(
        (file) =>
          file.mimetype.startsWith('audio/') ||
          file.mimetype === 'video/mp4' ||
          file.mimetype.startsWith('image/'),
      );
      if (!pdfFile && !audioFile)
        throw new Error('PDF and audio files are required');

      let audio_url = '';
      let pres_url = '';
      if (audioFile) {
        audio_url = await this.uploadSingleFile(
          audioFile,
          `${folderPath}/${audioFile.originalname}`,
        );
      }
      if (pdfFile) {
        const doctorClinic = await queryRunner.manager.findOne(UserClinic, {
          where: { clinic: { id: clinicId }, user: { uid: doctor } },
        });

        const headerImageBuffer =
          doctorClinic.headerImage && doctorClinic.headerImage.length > 0
            ? Buffer.from(
                `${doctorClinic.headerImage}`.replace(
                  /^data:image\/png;base64,/,
                  '',
                ),
                'base64',
              )
            : null;
        const modifiedPdfBuffer = await this.modifyPdf(
          pdfFile.buffer,
          headerImageBuffer,
          doctorClinic?.footerText ?? '',
        );
        const password = await this.generatePrescriptionPassword(
          queryRunner,
          patient,
        );
        const encryptedPdfBuffer = await this.encryptPdf(
          password,
          modifiedPdfBuffer,
        );
        const encryptedPdfFile: Express.Multer.File = {
          buffer: encryptedPdfBuffer,
          originalname: `encrypted_${pdfFile.originalname}`,
          mimetype: 'application/pdf',
          size: encryptedPdfBuffer.length,
          encoding: '7bit',
          fieldname: 'files',
          stream: Readable.from(encryptedPdfBuffer),
          destination: '',
          filename: '',
          path: '',
        };
        pres_url = await this.uploadSingleFile(
          encryptedPdfFile,
          `${folderPath}/${pdfFile.originalname}`,
        );
      }
      return { pres_url, audio_url };
    } catch (error) {
      throw error;
    }
  }

  async uploadSingleFile(
    file: Express.Multer.File,
    filePath: string,
  ): Promise<string> {
    const fileUpload = this.bucket.bucket().file(filePath);

    return new Promise<string>((resolve, reject) => {
      const stream = fileUpload.createWriteStream({
        metadata: { contentType: file.mimetype },
      });
      stream.on('error', async (error) => {
        await this.errorLogService.logError(
          `Error in uploading file: ${error.message}`,
          error.stack,
          null,
          null,
          null,
        );
        reject(new Error('Failed to upload file to Firebase Storage'));
      });

      stream.on('finish', async () => {
        try {
          await fileUpload.makePublic();
          const publicUrl = `https://storage.googleapis.com/${fileUpload.bucket.name}/${filePath}`;
          resolve(publicUrl);
        } catch (error) {
          await this.errorLogService.logError(
            `Error in making file public: ${error.message}`,
            error.stack,
            null,
            null,
            null,
          );

          // Generate a signed URL as a fallback
          try {
            const [signedUrl] = await fileUpload.getSignedUrl({
              action: 'read',
              expires: '03-01-2500', // Adjust as needed
            });
            resolve(signedUrl);
          } catch (signedError) {
            await this.errorLogService.logError(
              `Error in generating signed URL: ${signedError.message}`,
              signedError.stack,
              null,
              null,
              null,
            );
            reject(
              new InternalServerErrorException(
                'Failed to make file public or generate signed URL',
              ),
            );
          }
        }
      });
      stream.end(file.buffer);
    });
  }

  async uploadBackupToFirebase(filePath: string) {
    const backupFileName = 'backup-latest.sql';

    const fileUpload = this.bucket.bucket().file(`backups/${backupFileName}`);

    console.log(`Uploading backup to Firebase: ${filePath}`);

    return new Promise<void>((resolve, reject) => {
      const stream = fileUpload.createWriteStream({
        metadata: { contentType: 'application/sql' },
      });

      stream.on('error', async (error) => {
        await this.errorLogService.logError(
          `Error in uploading backup: ${error.message}`,
          error.stack,
          null,
          null,
          null,
        );
        reject(new Error('Failed to upload backup to Firebase Storage'));
      });

      stream.on('finish', async () => {
        try {
          await fileUpload.makePublic();
          console.log(
            `Backup uploaded and made public at: ${fileUpload.publicUrl()}`,
          );
          resolve();
        } catch (error) {
          await this.errorLogService.logError(
            `Error in making backup public: ${error.message}`,
            error.stack,
            null,
            null,
            null,
          );

          try {
            const [signedUrl] = await fileUpload.getSignedUrl({
              action: 'read',
              expires: '03-01-2500',
            });
            console.log(`Backup URL: ${signedUrl}`);
            resolve();
          } catch (signedError) {
            await this.errorLogService.logError(
              `Error in generating signed URL: ${signedError.message}`,
              signedError.stack,
              null,
              null,
              null,
            );
            reject(
              new InternalServerErrorException(
                'Failed to make backup public or generate signed URL',
              ),
            );
          }
        }
      });

      const readStream = fs.createReadStream(filePath);
      readStream.pipe(stream);
    });
  }

  async modifyPdf(
    buffer: Buffer,
    headerImageBuffer: Buffer | null,
    footerText: string,
  ): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(buffer);
    const newPdfDoc = await PDFDocument.create();

    const copiedPages = await newPdfDoc.copyPages(
      pdfDoc,
      pdfDoc.getPageIndices(),
    );

    for (const copiedPage of copiedPages) {
      const { width: pageWidth, height: pageHeight } = copiedPage.getSize();

      const newPage = newPdfDoc.addPage([pageWidth, pageHeight]);
      let contentStartY = pageHeight;

      if (headerImageBuffer) {
        try {
          const headerImage = await newPdfDoc.embedPng(headerImageBuffer);
          const imageScale = pageWidth / headerImage.width;
          const scaledHeight = headerImage.height * imageScale;

          newPage.drawImage(headerImage, {
            x: 0,
            y: pageHeight - scaledHeight,
            width: pageWidth,
            height: scaledHeight,
          });

          contentStartY = pageHeight - scaledHeight - 10;
        } catch (error) {
          console.warn(`Failed to embed header image: ${error.message}`);
        }
      }

      const embeddedPage = await newPdfDoc.embedPage(copiedPage);

      newPage.drawPage(embeddedPage, {
        x: 0,
        y: contentStartY - copiedPage.getHeight(),
        width: copiedPage.getWidth(),
        height: copiedPage.getHeight(),
      });

      const font = await newPdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 12;
      const lineHeight = fontSize + 2;

      const footerLines = footerText.split(/\r?\n/);
      const totalHeight = footerLines.length * lineHeight;

      footerLines.forEach((line, index) => {
        const textWidth = font.widthOfTextAtSize(line, fontSize);
        const footerX = (pageWidth - textWidth) / 2;

        newPage.drawText(line, {
          x: footerX,
          y: 10 + index * lineHeight,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      });

      newPage.drawLine({
        start: { x: 0, y: totalHeight + 10 },
        end: { x: pageWidth, y: totalHeight + 10 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
    }

    const modifiedPdfBytes = await newPdfDoc.save();
    return Buffer.from(modifiedPdfBytes);
  }

  private async encryptPdf(
    password: string,
    fileBuffer: Buffer,
  ): Promise<Buffer> {
    const inputPath = '/tmp/input.pdf';
    const outputPath = '/tmp/output.pdf';

    await writeFile(inputPath, fileBuffer);

    return new Promise((resolve, reject) => {
      try {
        const reader = muhammara.createReader(inputPath);
        const writer = muhammara.createWriter(outputPath, {
          userPassword: password,
          ownerPassword: password,
          userProtectionFlag: 4,
        });
        const copyingContext = writer.createPDFCopyingContext(inputPath);
        const pageCount = copyingContext
          .getSourceDocumentParser(inputPath)
          .getPagesCount();

        for (let i = 0; i < pageCount; i++) {
          copyingContext.appendPDFPageFromPDF(i);
        }
        writer.end();
        const encryptedBuffer = fs.readFileSync(outputPath);
        resolve(encryptedBuffer);
      } catch (error) {
        reject(error);
      }
    });
  }

  private async generatePrescriptionPassword(
    queryRunner: QueryRunner,
    patientId: string,
  ) {
    const patient = await queryRunner.manager.findOne(User, {
      where: { uid: patientId },
    });
    const fullName = patient.name.toUpperCase();
    const phoneNumber = patient.phoneNumber;

    const firstName = fullName.split(' ')[0];

    const firstFour = firstName.slice(0, 4);
    const lastFourDigits = phoneNumber.slice(-4);

    return firstFour + lastFourDigits;
  }
}
