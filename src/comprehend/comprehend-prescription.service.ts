import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FirebaseService } from 'src/firebase/firebase.service';
import { PrescriptionService } from 'src/prescription/prescription.service';

@Injectable()
export class ComprehendPrescriptionService {
  private genAI: GoogleGenerativeAI;
  private prompt: string;

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly prescriptionService: PrescriptionService,
  ) {
    const apiKey = process.env.GEMINI_GEN_AI_API_KEY;
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.prompt = process.env.GEMINI_PROMPT;
  }

  async comprehendPrescription(
    file: Express.Multer.File,
    doctor: string,
    patient: string,
  ): Promise<any> {
    try {
      // Convert file buffer to base64
      const base64AudioFile = file.buffer.toString('base64');
      // Set up model configuration
      const model = this.genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL,
        generationConfig: { maxOutputTokens: 8192, temperature: 0, topP: 0.95 },
      });

      // Generate content with audio data
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: file.mimetype, // Use the uploaded file's MIME type
            data: base64AudioFile,
          },
        },
        {
          text: this.prompt,
        },
      ]);
      console.log(result.response.text());
      const response = result.response.text();
      const jsonString = response
        .replace(/```/g, '')
        .replace('json', '')
        .trim();
      const parsedJson = JSON.parse(jsonString);

      const fileName = `${Date.now()}_${file.originalname}`;
      const filePath = `audio_files/${doctor}/${patient}/${fileName}`;
      const audio_url = await this.firebaseService.uploadSingleFile(file, filePath);
      const presDbData = { ...parsedJson, audio_url, doctor, patient, is_gemini_data: true };
      await this.prescriptionService.create(presDbData);

      return parsedJson;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Failed to comprehend prescription',
      );
    }
  }
}
