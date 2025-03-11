import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FirebaseService } from 'src/firebase/firebase.service';
import { PrescriptionService } from 'src/prescription/prescription.service';
import { ErrorLogService } from 'src/errorlog/error-log.service';
import { PrescriptionValidator } from 'src/validation/validation-util';
import { QueryRunner } from 'typeorm';
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
    let file_url: string | null = null;
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
      if (
        file.mimetype.startsWith('image/') ||
        file.mimetype === 'application/pdf'
      ) {
        fileData = {
          inlineData: {
            mimeType: file.mimetype,
            data: base64File,
          },
        };
        filePath = `image_prescription/${doctor}/${patient}/${fileName}`;
      } else if (file.mimetype.startsWith('audio/')) {
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
      if (filePath !== '') {
        file_url = await this.firebaseService.uploadSingleFile(file, filePath);
      }

      // Send file data directly to Gemini
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

      const updatedDjangoMedicationData =
        await this.djangoService.validateMedicines(
          validatedData?.medication,
          clinic,
        );
      if (updatedDjangoMedicationData && updatedDjangoMedicationData !== null) {
        validatedData['medication'] = updatedDjangoMedicationData;
      }

      const presDbData = {
        ...updatedDjangoMedicationData,
        file_url,
        appointmentId,
        patientId: patient,
        is_gemini_data: true,
      };
      await this.prescriptionService.create(
        presDbData,
        queryRunner,
        doctor,
        clinic,
      );

      return validatedData;
    } catch (error) {
      await this.errorLogService.logError(
        `Error while comprehending audio prescription: ${error.message}`,
        error.stack || '',
        file_url,
        doctor,
        patient,
      );
      throw new InternalServerErrorException(
        'Failed to comprehend prescription',
      );
    }
  }
}
