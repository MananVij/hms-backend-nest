import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';

@Injectable()
export class ComprehendPrescriptionService {
  private genAI: GoogleGenerativeAI;
  private prompt: string;

  constructor() {
    const apiKey = process.env.GEMINI_GEN_AI_API_KEY;
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.prompt = process.env.GEMINI_PROMPT;
  }

  async comprehendPrescription(fileName: string): Promise<any> {
    try {
      // Read and encode audio file
      const base64Buffer = fs.readFileSync(
        `/Users/vijmanan/Downloads/${fileName}.mp4`,
      );
      const base64AudioFile = base64Buffer.toString('base64');

      // Set up model configuration
      const model = this.genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL,
        generationConfig: { maxOutputTokens: 8192, temperature: 0, topP: 0.95 },
      });

      // Generate content with audio data
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: 'audio/mp3',
            data: base64AudioFile,
          },
        },
        {
          text: this.prompt,
        },
      ]);

      const response = await result.response.text();
      console.log(response);
      const jsonString = response
        .replace(/```/g, '')
        .replace('json', '')
        .replace(/\s+/g, ' ')
        .trim();
      const parsedJson = JSON.parse(jsonString);

      return parsedJson;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Failed to comprehend prescription',
      );
    }
  }
}
