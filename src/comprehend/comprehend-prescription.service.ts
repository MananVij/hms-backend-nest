import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FirebaseService } from 'src/firebase/firebase.service';
import { PrescriptionService } from 'src/prescription/prescription.service';
import { ErrorLogService } from 'src/errorlog/error-log.service';
import { PrescriptionValidator } from 'src/validation/validation-util';
import { DataSource, QueryRunner } from 'typeorm';
import { DjangoService } from 'src/django/django.service';

@Injectable()
export class ComprehendPrescriptionService {
  private genAI: GoogleGenerativeAI;
  private prompt: string;

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly prescriptionService: PrescriptionService,
    private readonly errorLogService: ErrorLogService,
    private readonly djangoService: DjangoService,
    private readonly dataSource: DataSource,
  ) {
    const apiKey = process.env.GEMINI_GEN_AI_API_KEY;
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.prompt = process.env.GEMINI_PROMPT;
  }

  async comprehendPrescription(
    file: Express.Multer.File,
    doctor: string,
    patient: string,
    clinic: number,
    appointmentId: string,
    queryRunner: QueryRunner,
  ): Promise<any> {
    try {
      // Convert file buffer to base64
      const base64File = file.buffer.toString('base64');
      // Set up model configuration
      const model = this.genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL,
        generationConfig: { maxOutputTokens: 8192, temperature: 0, topP: 0.95 },
      });

      // Create input object for Gemini
      const fileName = `${Date.now()}_${file.originalname}`;
      let filePath = '';
      let fileData;
      let is_handwritten_rx = false;
      let is_voice_rx = false;
      if (
        file.mimetype.startsWith('image/') ||
        file.mimetype === 'application/pdf'
      ) {
        is_handwritten_rx = true;
        fileData = {
          inlineData: {
            mimeType: file.mimetype,
            data: base64File,
          },
        };
        filePath = `image_prescription/${doctor}/${patient}/${fileName}`;
      } else if (file.mimetype.startsWith('audio/')) {
        is_voice_rx = true;
        fileData = {
          inlineData: {
            mimeType: file.mimetype,
            data: base64File,
          },
        };
        filePath = `audio_files/${doctor}/${patient}/${fileName}`;
      } else {
        throw new Error('Unsupported file type');
      }
      const result = await model.generateContent([
        fileData,
        { text: this.prompt },
      ]);
      const response = result.response.text();
      const jsonString = response
        .replace(/```/g, '')
        .replace('json', '')
        .trim();
      const parsedJson = JSON.parse(jsonString);
      const validatedData =
        PrescriptionValidator.validatePrescriptionData(parsedJson);

      let updatedDjangoMedicationData = validatedData;

      // if (is_voice_rx) {
      //   updatedDjangoMedicationData =
      //     await this.djangoService.validateMedicines(
      //       validatedData?.medication,
      //       clinic,
      //     );
      //   if (
      //     updatedDjangoMedicationData &&
      //     updatedDjangoMedicationData !== null
      //   ) {
      //     validatedData['medication'] = updatedDjangoMedicationData;
      //   }
      // }

      this.handleAllBackgroundOperations(
        file,
        filePath,
        updatedDjangoMedicationData,
        appointmentId,
        patient,
        doctor,
        clinic,
        is_handwritten_rx,
        is_voice_rx
      );

      return validatedData;
    } catch (error) {
      this.errorLogService.logError(
        `Error while comprehending prescription: ${error.message}`,
        error.stack || '',
        null,
        doctor,
        patient,
      );
      throw new InternalServerErrorException(
        'Failed to comprehend prescription',
      );
    }
  }

    private async handleAllBackgroundOperations(
    file: Express.Multer.File,
    filePath: string,
    medicationData: any,
    appointmentId: string,
    patient: string,
    doctor: string,
    clinic: number,
    is_handwritten_rx: boolean,
    is_voice_rx: boolean
  ): Promise<void> {
    try {
      let file_url: string | null = null;
      if (filePath !== '') {
        try {
          file_url = await this.firebaseService.uploadSingleFile(file, filePath);
        } catch (uploadError) {
          this.errorLogService.logError(
            `File upload failed: ${uploadError.message}`,
            uploadError.stack || '',
            null,
            doctor,
            patient,
          );
        }
      }      
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      
      try {
        const presDbData = {
          ...medicationData,
          audio_url: file_url,
          appointmentId,
          patientId: patient,
          is_gemini_data: true,
          is_handwritten_rx,
          is_voice_rx,
        };
        await this.prescriptionService.create(
          presDbData,
          queryRunner,
          doctor,
          clinic,
        );
        
        await queryRunner.commitTransaction();
      } catch (dbError) {
        await queryRunner.rollbackTransaction();
        throw dbError;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.errorLogService.logError(
        `Background operation error: ${error.message}`,
        error.stack || '',
        null,
        doctor,
        patient,
      );
    }
  }
}
