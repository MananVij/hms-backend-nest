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
    this.prompt = this.getOptimizedPrompt();
  }

  private getOptimizedPrompt(): string {
    // Use environment prompt if available, otherwise use optimized default
    return process.env.GEMINI_PROMPT || `
CRITICAL JSON FORMATTING RULES:
1. Return ONLY pure JSON - no explanations, no markdown, no code blocks
2. NEVER use \`\`\`json or \`\`\` or any markdown formatting
3. Start directly with { and end with }
4. Use proper JSON syntax: double quotes, correct commas, proper brackets
5. Do not add any text before or after the JSON

TASK: Convert unstructured medical data to JSON with this exact structure:

{
  "diagnosis": "string",
  "history": "string", 
  "name": "string",
  "age": "int",
  "sex": "string",
  "medication": [
    {
      "medicine_name": "string",
      "dosage": "string",
      "days": "int",
      "tapering": [
        {
          "frequency": "string (must be one of: od, bid, tid, qid, hs, ac, pc, qam, qpm, bs, q6h, q8h, q12h, qod, q1w, q2w, q3w, q1m)",
          "days": "int",
          "comments": "string"
        }
      ],
      "is_sos": "bool",
      "food": {
        "before_breakfast": "bool",
        "after_breakfast": "bool", 
        "lunch": "bool",
        "dinner": "bool"
      },
      "frequency": {
        "od": "bool", "bid": "bool", "tid": "bool", "qid": "bool", "hs": "bool", 
        "ac": "bool", "pc": "bool", "qam": "bool", "qpm": "bool", "bs": "bool",
        "q6h": "bool", "q8h": "bool", "q12h": "bool", "qod": "bool", 
        "q1w": "bool", "q2w": "bool", "q3w": "bool", "q1m": "bool"
      }
    }
  ],
  "test_suggested": "string",
  "test_results": "string", 
  "medical_notes": "string",
  "followUp": "string (ISO format: YYYY-MM-DD) or null if missing"
}

EXTRACTION RULES:
- Return empty string ("") for unhandled or missing data
- Return empty string ("") for "tapering.frequency" if missing or unclear
- Return null for "tapering" if not mentioned
- Extract medicine name and dosage separately - do not include dosage in medicine name
- Include dosage units if provided
- Retain prefixes (tab, syrup, etc.) in medicine names
- Handle abbreviations (od, bid, etc.) in frequency object, not meal timings
- Use proper JSON boolean values: true/false (not "true"/"false")
- Use proper JSON integers for age and days (not strings)
- Ensure all commas and brackets are correctly placed

REMEMBER: Return ONLY the JSON object. No additional text whatsoever.
`.trim();
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
      
      // Enhanced JSON parsing with optimized prompt
      const parsedJson = await this.parseAIResponse(response, model, fileData);
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
      // Non-blocking error logging
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

  private async parseAIResponse(response: string, model: any, fileData: any, maxRetries: number = 2): Promise<any> {
    // Try multiple JSON cleaning strategies
    const cleaningStrategies = [
      // Strategy 1: Basic cleaning
      (text: string) => text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim(),
      
      // Strategy 2: More aggressive cleaning
      (text: string) => {
        let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        // Remove any text before first { or [
        const firstBrace = Math.min(
          cleaned.indexOf('{') !== -1 ? cleaned.indexOf('{') : Infinity,
          cleaned.indexOf('[') !== -1 ? cleaned.indexOf('[') : Infinity
        );
        if (firstBrace !== Infinity) {
          cleaned = cleaned.substring(firstBrace);
        }
        // Remove any text after last } or ]
        const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
        if (lastBrace !== -1) {
          cleaned = cleaned.substring(0, lastBrace + 1);
        }
        return cleaned;
      },
      
      // Strategy 3: Extract JSON using regex
      (text: string) => {
        const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        return jsonMatch ? jsonMatch[0] : text;
      }
    ];

    // Try each cleaning strategy
    for (const cleanStrategy of cleaningStrategies) {
      try {
        const cleanedResponse = cleanStrategy(response);
        const parsedJson = JSON.parse(cleanedResponse);
        return parsedJson;
      } catch (parseError) {
        // Continue to next strategy
        continue;
      }
    }

    // If all cleaning strategies fail, try to retry with AI
    if (maxRetries > 0) {
      try {
        const retryResult = await model.generateContent([
          fileData, 
          { 
            text: `${this.prompt}\n\nIMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or extra text. Start directly with { and end with }.` 
          }
        ]);
        const retryResponse = retryResult.response.text();
        return await this.parseAIResponse(retryResponse, model, fileData, maxRetries - 1);
      } catch (retryError) {
        // Log retry error but continue to fallback
        this.errorLogService.logError(
          `AI retry failed: ${retryError.message}`,
          retryError.stack || '',
          null,
          'system',
          'system',
        );
      }
    }

    // Final fallback: try to create a basic structure
    try {
      // Look for key medical terms and create a basic structure
      const basicStructure = {
        medication: [],
        diagnosis: response.includes('diagnosis') ? response.substring(0, 100) : '',
        symptoms: response.includes('symptom') ? response.substring(0, 100) : '',
        notes: response.substring(0, 200),
        is_parsing_failed: true
      };
      return basicStructure;
    } catch (fallbackError) {
      throw new Error(`Failed to parse AI response after all attempts. Original response: ${response.substring(0, 200)}...`);
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
      
      // Upload file to Firebase (background operation)
      if (filePath !== '') {
        try {
          file_url = await this.firebaseService.uploadSingleFile(file, filePath);
        } catch (uploadError) {
          // Non-blocking error logging for upload failure
          this.errorLogService.logError(
            `File upload failed: ${uploadError.message}`,
            uploadError.stack || '',
            null,
            doctor,
            patient,
          );
        }
      }
      
      // Save to database (background operation) - create new transaction
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
      // Non-blocking error logging for background operations
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
