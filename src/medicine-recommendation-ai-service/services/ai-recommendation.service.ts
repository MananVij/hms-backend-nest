import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIChiefComplaint } from '../entity/ai-chief-complaint.entity';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { DataSource } from 'typeorm';
import { ErrorLogService } from '../../errorlog/error-log.service';

export interface MedicineRecommendation {
  medicineName: string;
  medicine: string;
  confidence: number;
  evidenceStrength?: string;
  clinicalSupport?: string;
  prescriptionCount?: number;
  usagePercentage?: number;
  diagnosisName?: string;
}

export interface DiagnosisRecommendation {
  diagnosisName: string;
  diagnosis: string;
  confidence: number;
  evidenceStrength?: string;
  matchQuality?: string;
  clinicalSupport?: string;
  prescriptionCount?: number;
}

export interface ChiefComplaint {
  complaint: string;
  category?: string;
  description?: string;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

@Injectable()
export class AIRecommendationService {
  private readonly AI_SERVICE_URL =
    process.env.AI_SERVICE_URL || 'http://localhost:8001';

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(AIChiefComplaint)
    private aiChiefComplaintRepository: Repository<AIChiefComplaint>,
    private readonly dataSource: DataSource,
    private readonly errorLogService: ErrorLogService,
  ) {}

  async getChiefComplaints(
    specialization: string,
    doctorId?: string,
  ): Promise<ServiceResponse<ChiefComplaint[]>> {
    // Input validation
    if (
      !specialization ||
      typeof specialization !== 'string' ||
      specialization.trim().length === 0
    ) {
      await this.errorLogService.logError(
        'Invalid specialization parameter in getChiefComplaints',
        new Error('Specialization is required and must be a non-empty string')
          .stack,
        undefined,
        doctorId,
      );
      return {
        success: false,
        error: 'Specialization is required',
        data: [],
      };
    }

    const normalizedSpecialization = specialization.trim().toLowerCase();

    try {
      // Add timeout and error handling for HTTP request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 second timeout

      const response: AxiosResponse<any> = await firstValueFrom(
        this.httpService.get(
          `${this.AI_SERVICE_URL}/ai/chief-complaints?specialization=${encodeURIComponent(normalizedSpecialization)}`,
          {
            timeout: 5000,
            signal: controller.signal,
          },
        ),
      );

      clearTimeout(timeoutId);

      // Validate response structure
      if (
        response?.data?.success &&
        Array.isArray(response.data.chief_complaints)
      ) {
        const chiefComplaints = response.data.chief_complaints
          .filter((cc) => cc && (cc.complaint || cc.chiefComplaint)) // Filter out invalid entries
          .map((cc: any) => ({
            complaint: (cc.complaint || cc.chiefComplaint || '')
              .toString()
              .trim(),
            category: cc.category ? cc.category.toString().trim() : undefined,
            description: cc.description
              ? cc.description.toString().trim()
              : undefined,
          }))
          .filter((cc) => cc.complaint.length > 0); // Remove empty complaints

        return {
          success: true,
          data: chiefComplaints,
        };
      } else {
        const localComplaints = await this.getLocalChiefComplaints(
          normalizedSpecialization,
        );
        return {
          success: true,
          data: localComplaints,
          message:
            'Used local chief complaints due to invalid AI service response',
        };
      }
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'AI service connection refused';
      } else if (error.response?.status) {
        errorMessage = `AI service HTTP ${error.response.status}: ${error.response.statusText}`;
      } else {
        errorMessage = error.message || error.toString();
      }

      await this.errorLogService.logError(
        `Error getting chief complaints from AI service: ${errorMessage}`,
        error.stack,
        undefined,
        doctorId,
      );

      try {
        const localComplaints = await this.getLocalChiefComplaints(
          normalizedSpecialization,
        );
        return {
          success: true,
          data: localComplaints,
          message: 'Used local chief complaints due to AI service error',
        };
      } catch (localError) {
        await this.errorLogService.logError(
          `Error in local chief complaints fallback: ${localError.message}`,
          localError.stack,
          undefined,
          doctorId,
        );
        return {
          success: false,
          error:
            'Failed to get chief complaints from both AI service and local fallback',
          data: [],
        };
      }
    }
  }

  async getDiagnosisRecommendations(
    chiefComplaint: string,
    specialization: string,
    doctorId?: string,
  ): Promise<ServiceResponse<string[]>> {
    // Input validation
    if (
      !chiefComplaint ||
      typeof chiefComplaint !== 'string' ||
      chiefComplaint.trim().length === 0
    ) {
      await this.errorLogService.logError(
        'Invalid chiefComplaint parameter in getDiagnosisRecommendations',
        new Error('Chief complaint is required and must be a non-empty string')
          .stack,
        undefined,
        doctorId,
      );
      return {
        success: false,
        error: 'Chief complaint is required',
        data: [],
      };
    }

    if (
      !specialization ||
      typeof specialization !== 'string' ||
      specialization.trim().length === 0
    ) {
      await this.errorLogService.logError(
        'Invalid specialization parameter in getDiagnosisRecommendations',
        new Error('Specialization is required and must be a non-empty string')
          .stack,
        undefined,
        doctorId,
      );
      return {
        success: false,
        error: 'Specialization is required',
        data: [],
      };
    }

    const normalizedComplaint = chiefComplaint.trim();
    const normalizedSpecialization = specialization.trim().toLowerCase();

    try {
      const aiRequest = {
        doctor_id: doctorId || '0820ca6e-94bd-4210-8311-75906ae82e99',
        complaints: [normalizedComplaint],
        specialization: normalizedSpecialization,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout

      const response: AxiosResponse<any> = await firstValueFrom(
        this.httpService.post(
          `${this.AI_SERVICE_URL}/ai/diagnosis-recommendations`,
          aiRequest,
          {
            timeout: 10000,
            signal: controller.signal,
          },
        ),
      );

      clearTimeout(timeoutId);

      if (
        response?.data?.success &&
        Array.isArray(response.data.diagnosis_recommendations)
      ) {
        const recommendations = this.formatDiagnosisRecommendations(
          response.data.diagnosis_recommendations,
        );
        if (recommendations.length === 0) {
          const localRecommendations =
            await this.getLocalDiagnosisRecommendations(
              normalizedComplaint,
              normalizedSpecialization,
            );
          const diagnosisNames = localRecommendations
            .map((rec) => rec.diagnosisName || rec.diagnosis)
            .filter(Boolean);
          return {
            success: true,
            data: diagnosisNames,
            message:
              'Used local diagnosis recommendations due to empty AI results',
          };
        }

        recommendations.sort((a, b) => b.confidence - a.confidence);
        const top10Recommendations = recommendations.slice(0, 10);
        const diagnosisNames = top10Recommendations
          .map((rec) => rec.diagnosisName || rec.diagnosis)
          .filter(Boolean);

        return {
          success: true,
          data: diagnosisNames,
        };
      } else {
        const localRecommendations =
          await this.getLocalDiagnosisRecommendations(
            normalizedComplaint,
            normalizedSpecialization,
          );
        const diagnosisNames = localRecommendations
          .map((rec) => rec.diagnosisName || rec.diagnosis)
          .filter(Boolean);
        return {
          success: true,
          data: diagnosisNames,
          message:
            'Used local diagnosis recommendations due to AI service failure',
        };
      }
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'AI service connection refused';
      } else if (error.response?.status) {
        errorMessage = `AI service HTTP ${error.response.status}: ${error.response.statusText}`;
      } else {
        errorMessage = error.message || error.toString();
      }

      await this.errorLogService.logError(
        `Error getting diagnosis recommendations from AI service: ${errorMessage}`,
        error.stack,
        undefined,
        doctorId,
      );

      try {
        const localRecommendations =
          await this.getLocalDiagnosisRecommendations(
            normalizedComplaint,
            normalizedSpecialization,
          );
        const diagnosisNames = localRecommendations
          .map((rec) => rec.diagnosisName || rec.diagnosis)
          .filter(Boolean);
        return {
          success: true,
          data: diagnosisNames,
          message:
            'Used local diagnosis recommendations due to AI service error',
        };
      } catch (localError) {
        await this.errorLogService.logError(
          `Error in local diagnosis recommendations fallback: ${localError.message}`,
          localError.stack,
          undefined,
          doctorId,
        );
        return {
          success: false,
          error:
            'Failed to get diagnosis recommendations from both AI service and local fallback',
          data: [],
        };
      }
    }
  }

  async getMedicineRecommendations(request: {
    diagnosis: string;
    specialty?: string;
    chiefComplaint?: string;
    doctorId?: string;
  }): Promise<ServiceResponse<string[]>> {
    // Input validation
    if (!request || typeof request !== 'object') {
      await this.errorLogService.logError(
        'Invalid request object in getMedicineRecommendations',
        new Error('Request object is required').stack,
        undefined,
        request?.doctorId,
      );
      return {
        success: false,
        error: 'Request object is required',
        data: [],
      };
    }

    if (
      !request.diagnosis ||
      typeof request.diagnosis !== 'string' ||
      request.diagnosis.trim().length === 0
    ) {
      await this.errorLogService.logError(
        'Invalid diagnosis parameter in getMedicineRecommendations',
        new Error('Diagnosis is required and must be a non-empty string').stack,
        undefined,
        request.doctorId,
      );
      return {
        success: false,
        error: 'Diagnosis is required',
        data: [],
      };
    }

    const normalizedDiagnosis = request.diagnosis.trim();
    const normalizedSpecialty = request.specialty
      ? request.specialty.trim().toLowerCase()
      : undefined;

    try {
      // For now, skip Python AI service and go directly to local method
      const localRecommendations = await this.getLocalMedicineRecommendations({
        diagnosis: [normalizedDiagnosis],
        specialty: normalizedSpecialty,
      });

      // Convert to simple string array - medicine names only, sorted by confidence
      const medicineNames = localRecommendations
        .map((rec) => {
          const name = rec.medicineName || rec.medicine;
          return typeof name === 'string' ? name.trim() : '';
        })
        .filter((name) => name.length > 0);

      return {
        success: true,
        data: medicineNames,
        message: 'Using local medicine recommendations',
      };
    } catch (error) {
      await this.errorLogService.logError(
        `Error getting medicine recommendations: ${error.message}`,
        error.stack,
        undefined,
        request.doctorId,
      );

      return {
        success: false,
        error: 'Failed to get medicine recommendations',
        data: [],
      };
    }
  }

  async getClinicalNotesRecommendations(
    diagnosis: string,
    specialization?: string,
    doctorId?: string,
  ): Promise<ServiceResponse<string[]>> {
    // Input validation
    if (
      !diagnosis ||
      typeof diagnosis !== 'string' ||
      diagnosis.trim().length === 0
    ) {
      await this.errorLogService.logError(
        'Invalid diagnosis parameter in getClinicalNotesRecommendations',
        new Error('Diagnosis is required and must be a non-empty string').stack,
        undefined,
        doctorId,
      );
      return {
        success: false,
        error: 'Diagnosis is required',
        data: [],
      };
    }

    const normalizedDiagnosis = diagnosis.trim();
    const normalizedSpecialization = specialization
      ? specialization.trim().toLowerCase()
      : undefined;

    try {
      // For now, skip Python AI service and go directly to local method
      const localNotes = await this.getLocalClinicalNotes(
        normalizedDiagnosis,
        normalizedSpecialization,
      );

      // Validate and clean notes
      const validNotes = localNotes
        .filter((note) => note && typeof note === 'string')
        .map((note) => note.trim())
        .filter((note) => note.length > 0);

      return {
        success: true,
        data: validNotes,
        message: 'Using local clinical notes',
      };
    } catch (error) {
      await this.errorLogService.logError(
        `Error getting clinical notes: ${error.message}`,
        error.stack,
        undefined,
        doctorId,
      );

      return {
        success: false,
        error: 'Failed to get clinical notes',
        data: [],
      };
    }
  }

  private formatDiagnosisRecommendations(
    aiRecommendations: any[],
  ): DiagnosisRecommendation[] {
    if (!Array.isArray(aiRecommendations)) {
      return [];
    }

    return aiRecommendations.map((rec) => ({
      diagnosisName: rec.diagnosis || rec.diagnosisName || 'Unknown Diagnosis',
      diagnosis: rec.diagnosis || rec.diagnosisName,
      confidence: rec.confidence_score || rec.confidence || 0.5,
      evidenceStrength: rec.evidenceStrength,
      matchQuality: rec.matchQuality,
      clinicalSupport: rec.clinicalSupport,
      prescriptionCount: rec.prescriptionCount,
    }));
  }

  private async getLocalChiefComplaints(
    specialization: string,
  ): Promise<ChiefComplaint[]> {
    try {
      const chiefComplaints = await this.aiChiefComplaintRepository.find({
        where: { specialty: specialization, trainingEligible: true },
        take: 20,
      });

      return chiefComplaints.map((cc) => ({
        complaint: cc.chiefComplaint,
        category: cc.specialty,
      }));
    } catch (error) {
      await this.errorLogService.logError(
        `Error getting local chief complaints: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  private async getLocalDiagnosisRecommendations(
    chiefComplaint: string,
    specialization: string,
  ): Promise<DiagnosisRecommendation[]> {
    try {
      // Use raw SQL query to bypass potential TypeORM mapping issues
      let rawQuery = `
        SELECT chief_complaint, mapped_diagnoses 
        FROM ai_chief_complaints 
        WHERE LOWER(chief_complaint) LIKE LOWER($1) 
        AND specialty = $2 
        AND training_eligible = true
        LIMIT 15
      `;

      let parameters = [`%${chiefComplaint}%`, specialization];

      let results = await this.dataSource.query(rawQuery, parameters);

      // If no results, try fuzzy word-based matching
      if (results.length === 0) {
        const words = chiefComplaint
          .toLowerCase()
          .split(/\s+/)
          .filter((word) => word.length > 2);

        if (words.length > 0) {
          const wordConditions = words
            .map(
              (_, index) => `LOWER(chief_complaint) LIKE LOWER($${index + 2})`,
            )
            .join(' OR ');
          const fuzzyQuery = `
            SELECT chief_complaint, mapped_diagnoses 
            FROM ai_chief_complaints 
            WHERE (${wordConditions})
            AND specialty = $1 
            AND training_eligible = true
            LIMIT 20
          `;

          const fuzzyParams = [
            specialization,
            ...words.map((word) => `%${word}%`),
          ];
          results = await this.dataSource.query(fuzzyQuery, fuzzyParams);
        }
      }

      if (results.length === 0) {
        return [];
      }

      // Collect all diagnoses from all matching chief complaints
      const allDiagnoses = new Set<string>();
      const chiefComplaintMatches = new Map<
        string,
        { complaint: string; matchType: 'exact' | 'partial' | 'fuzzy' }
      >();

      for (const result of results) {
        const complaint = result.chief_complaint;
        const mappedDiagnoses = result.mapped_diagnoses;

        // Determine match quality
        const matchType = this.determineMatchQuality(chiefComplaint, complaint);

        if (Array.isArray(mappedDiagnoses)) {
          mappedDiagnoses.forEach((diagnosis) => {
            allDiagnoses.add(diagnosis);
            if (
              !chiefComplaintMatches.has(diagnosis) ||
              (matchType === 'exact' &&
                chiefComplaintMatches.get(diagnosis)?.matchType !== 'exact')
            ) {
              chiefComplaintMatches.set(diagnosis, { complaint, matchType });
            }
          });
        }
      }

      // Calculate dynamic scores for each diagnosis
      const diagnosisRecommendations: DiagnosisRecommendation[] = [];

      for (const diagnosis of allDiagnoses) {
        const matchInfo = chiefComplaintMatches.get(diagnosis);
        const dynamicScore = await this.calculateDiagnosisScore(
          diagnosis,
          specialization,
          matchInfo?.matchType || 'fuzzy',
        );

        diagnosisRecommendations.push({
          diagnosisName: diagnosis,
          diagnosis: diagnosis,
          confidence: dynamicScore.finalScore,
          evidenceStrength: dynamicScore.evidenceStrength,
          matchQuality: dynamicScore.matchQuality,
          clinicalSupport: dynamicScore.clinicalSupport,
          prescriptionCount: dynamicScore.prescriptionCount,
        });
      }

      // Sort by final score (highest first) and limit to top 10
      diagnosisRecommendations.sort((a, b) => b.confidence - a.confidence);
      const top10Recommendations = diagnosisRecommendations.slice(0, 10);

      return top10Recommendations;
    } catch (error) {
      await this.errorLogService.logError(
        `Error in local diagnosis search: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  private determineMatchQuality(
    searchTerm: string,
    foundComplaint: string,
  ): 'exact' | 'partial' | 'fuzzy' {
    const searchLower = searchTerm.toLowerCase().trim();
    const foundLower = foundComplaint.toLowerCase().trim();

    // Exact match
    if (searchLower === foundLower) {
      return 'exact';
    }

    // Partial match - search term contains in found or vice versa
    if (foundLower.includes(searchLower) || searchLower.includes(foundLower)) {
      return 'partial';
    }

    // Fuzzy match - word-based overlap
    return 'fuzzy';
  }

  private async calculateDiagnosisScore(
    diagnosis: string,
    specialization: string,
    matchType: 'exact' | 'partial' | 'fuzzy',
  ): Promise<{
    finalScore: number;
    evidenceStrength: string;
    matchQuality: string;
    clinicalSupport: string;
    prescriptionCount: number;
  }> {
    try {
      // 1. Clinical Evidence (50% weight) - Based on prescription frequency
      const prescriptionQuery = `
        SELECT COUNT(*) as prescription_count, COUNT(DISTINCT doctor_id) as doctor_count
        FROM normalized_prescriptions 
        WHERE diagnosis_name = $1 AND specialty = $2 AND training_eligible = true
      `;
      const prescriptionResult = await this.dataSource.query(
        prescriptionQuery,
        [diagnosis, specialization],
      );
      const prescriptionCount = parseInt(
        prescriptionResult[0]?.prescription_count || '0',
      );
      const doctorCount = parseInt(prescriptionResult[0]?.doctor_count || '0');

      // Calculate evidence strength based on prescription frequency (not doctor count)
      let evidenceScore: number;
      let evidenceStrength: string;

      if (prescriptionCount >= 15) {
        evidenceScore = 1.0;
        evidenceStrength = 'Strong';
      } else if (prescriptionCount >= 8) {
        evidenceScore = 0.8;
        evidenceStrength = 'Moderate';
      } else if (prescriptionCount >= 3) {
        evidenceScore = 0.6;
        evidenceStrength = 'Weak';
      } else {
        evidenceScore = 0.4;
        evidenceStrength = 'Limited';
      }

      // 2. Match Quality (30% weight)
      let matchScore: number;
      let matchQuality: string;

      switch (matchType) {
        case 'exact':
          matchScore = 1.0;
          matchQuality = 'Exact Match';
          break;
        case 'partial':
          matchScore = 0.7;
          matchQuality = 'Partial Match';
          break;
        case 'fuzzy':
          matchScore = 0.4;
          matchQuality = 'Fuzzy Match';
          break;
      }

      // 3. Clinical Support (20% weight) - Usage percentage within specialty
      const totalCasesQuery = `
        SELECT COUNT(*) as total_cases
        FROM normalized_prescriptions 
        WHERE specialty = $1 AND training_eligible = true
      `;
      const totalResult = await this.dataSource.query(totalCasesQuery, [
        specialization,
      ]);
      const totalCases = parseInt(totalResult[0]?.total_cases || '1');

      const usagePercentage = (prescriptionCount / totalCases) * 100;
      let supportScore: number;
      let clinicalSupport: string;

      if (usagePercentage >= 5.0) {
        supportScore = 1.0;
        clinicalSupport = 'Very High Usage';
      } else if (usagePercentage >= 2.0) {
        supportScore = 0.8;
        clinicalSupport = 'High Usage';
      } else if (usagePercentage >= 0.5) {
        supportScore = 0.6;
        clinicalSupport = 'Moderate Usage';
      } else {
        supportScore = 0.4;
        clinicalSupport = 'Low Usage';
      }

      // Calculate final weighted score
      const finalScore =
        evidenceScore * 0.5 + // 50% weight
        matchScore * 0.3 + // 30% weight
        supportScore * 0.2; // 20% weight

      return {
        finalScore: Math.round(finalScore * 100) / 100, // Round to 2 decimal places
        evidenceStrength,
        matchQuality,
        clinicalSupport,
        prescriptionCount,
      };
    } catch (error) {
      await this.errorLogService.logError(
        `Error calculating diagnosis score: ${error.message}`,
        error.stack,
      );
      return {
        finalScore: 0.3,
        evidenceStrength: 'Error',
        matchQuality: 'Unknown',
        clinicalSupport: 'Unknown',
        prescriptionCount: 0,
      };
    }
  }

  private async getLocalMedicineRecommendations(
    request: any,
  ): Promise<MedicineRecommendation[]> {
    try {
      // Input validation
      if (!request || typeof request !== 'object') {
        await this.errorLogService.logError(
          'Invalid request object in getLocalMedicineRecommendations',
          new Error('Request object is required').stack,
        );
        return [];
      }

      const { diagnosis } = request;

      if (!diagnosis || !Array.isArray(diagnosis) || diagnosis.length === 0) {
        await this.errorLogService.logError(
          'Invalid diagnosis array in getLocalMedicineRecommendations',
          new Error('Diagnosis array is required and must not be empty').stack,
        );
        return [];
      }

      // Validate and sanitize diagnosis inputs
      const validDiagnoses = diagnosis
        .filter((d) => d && typeof d === 'string')
        .map((d) => d.trim())
        .filter((d) => d.length > 0);

      if (validDiagnoses.length === 0) {
        await this.errorLogService.logError(
          'No valid diagnoses found in getLocalMedicineRecommendations',
          new Error('All diagnosis entries are invalid').stack,
        );
        return [];
      }

      // Step 1: Find all matching diagnoses using fuzzy search (like diagnosis recommendations do)
      const allMatchingDiagnoses = new Set<string>();

      for (const searchDiagnosis of validDiagnoses) {
        try {
          // Exact match first
          let exactQuery = `
            SELECT DISTINCT diagnosis_name 
            FROM normalized_prescriptions 
            WHERE LOWER(diagnosis_name) = LOWER($1) 
            AND training_eligible = true
          `;
          let exactResults = await this.dataSource.query(exactQuery, [
            searchDiagnosis,
          ]);

          // Partial match (contains)
          let partialQuery = `
            SELECT DISTINCT diagnosis_name 
            FROM normalized_prescriptions 
            WHERE LOWER(diagnosis_name) LIKE LOWER($1) 
            AND training_eligible = true
          `;
          let partialResults = await this.dataSource.query(partialQuery, [
            `%${searchDiagnosis}%`,
          ]);

          // Add all found diagnoses with validation
          [...(exactResults || []), ...(partialResults || [])].forEach(
            (result) => {
              if (
                result &&
                result.diagnosis_name &&
                typeof result.diagnosis_name === 'string'
              ) {
                allMatchingDiagnoses.add(result.diagnosis_name.trim());
              }
            },
          );

          // If no results, try fuzzy word-based matching
          if (
            (!exactResults || exactResults.length === 0) &&
            (!partialResults || partialResults.length === 0)
          ) {
            const words = searchDiagnosis
              .toLowerCase()
              .split(/\s+/)
              .filter((word) => word.length > 2);

            if (words.length > 0) {
              const wordConditions = words
                .map(
                  (_, index) =>
                    `LOWER(diagnosis_name) LIKE LOWER($${index + 1})`,
                )
                .join(' OR ');
              const fuzzyQuery = `
                SELECT DISTINCT diagnosis_name 
                FROM normalized_prescriptions 
                WHERE (${wordConditions})
                AND training_eligible = true
                LIMIT 20
              `;

              const fuzzyParams = words.map((word) => `%${word}%`);
              const fuzzyResults = await this.dataSource.query(
                fuzzyQuery,
                fuzzyParams,
              );

              (fuzzyResults || []).forEach((result) => {
                if (
                  result &&
                  result.diagnosis_name &&
                  typeof result.diagnosis_name === 'string'
                ) {
                  allMatchingDiagnoses.add(result.diagnosis_name.trim());
                }
              });
            }
          }
        } catch (diagnosisError) {
          await this.errorLogService.logError(
            `Error searching for diagnosis "${searchDiagnosis}": ${diagnosisError.message}`,
            diagnosisError.stack,
          );
          // Continue with other diagnoses
        }
      }

      const matchingDiagnosesArray = Array.from(allMatchingDiagnoses).filter(
        (d) => d.length > 0,
      );

      if (matchingDiagnosesArray.length === 0) {
        return [];
      }

      // Step 2: Use the matched diagnoses to get medicines
      const diagnosisPlaceholders = matchingDiagnosesArray
        .map((_, index) => `$${index + 1}`)
        .join(', ');
      const rawQuery = `
        SELECT DISTINCT medicine_name, diagnosis_name, COUNT(*) as prescription_count
        FROM normalized_prescriptions 
        WHERE diagnosis_name IN (${diagnosisPlaceholders})
        AND training_eligible = true
        AND medicine_name IS NOT NULL
        AND TRIM(medicine_name) != ''
        GROUP BY medicine_name, diagnosis_name
        ORDER BY prescription_count DESC
        LIMIT 50
      `;

      const rawResults = await this.dataSource.query(
        rawQuery,
        matchingDiagnosesArray,
      );

      if (!rawResults || rawResults.length === 0) {
        return [];
      }

      // Calculate dynamic scores for each medicine
      const medicineRecommendations: MedicineRecommendation[] = [];

      for (const result of rawResults) {
        try {
          // Validate result structure
          if (!result || !result.medicine_name || !result.diagnosis_name) {
            continue;
          }

          const medicineName = result.medicine_name.toString().trim();
          const diagnosisName = result.diagnosis_name.toString().trim();
          const prescriptionCount = parseInt(result.prescription_count) || 0;

          if (medicineName.length === 0 || diagnosisName.length === 0) {
            continue;
          }

          const dynamicScore = await this.calculateMedicineScore(
            medicineName,
            diagnosisName,
            prescriptionCount,
          );

          medicineRecommendations.push({
            medicineName: medicineName,
            medicine: medicineName,
            confidence: dynamicScore.finalScore,
            evidenceStrength: dynamicScore.evidenceStrength,
            clinicalSupport: dynamicScore.clinicalSupport,
            prescriptionCount: dynamicScore.prescriptionCount,
            usagePercentage: dynamicScore.usagePercentage,
            diagnosisName: diagnosisName,
          });
        } catch (scoreError) {
          await this.errorLogService.logError(
            `Error calculating score for medicine "${result.medicine_name}": ${scoreError.message}`,
            scoreError.stack,
          );
          // Continue with other medicines
        }
      }

      // Sort by final score (highest first) and limit to top 10
      medicineRecommendations.sort(
        (a, b) => (b.confidence || 0) - (a.confidence || 0),
      );
      const top10Recommendations = medicineRecommendations.slice(0, 10);

      return top10Recommendations;
    } catch (error) {
      await this.errorLogService.logError(
        `Error getting local medicine recommendations: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  private async calculateMedicineScore(
    medicineName: string,
    diagnosisName: string,
    prescriptionCount: number,
  ): Promise<{
    finalScore: number;
    evidenceStrength: string;
    clinicalSupport: string;
    prescriptionCount: number;
    usagePercentage: number;
  }> {
    try {
      // Input validation
      if (
        !medicineName ||
        typeof medicineName !== 'string' ||
        medicineName.trim().length === 0
      ) {
        throw new Error('Invalid medicine name');
      }
      if (
        !diagnosisName ||
        typeof diagnosisName !== 'string' ||
        diagnosisName.trim().length === 0
      ) {
        throw new Error('Invalid diagnosis name');
      }
      if (typeof prescriptionCount !== 'number' || prescriptionCount < 0) {
        throw new Error('Invalid prescription count');
      }

      // 1. Clinical Evidence (60% weight) - Based on prescription frequency for this medicine-diagnosis pair
      let evidenceScore: number;
      let evidenceStrength: string;

      if (prescriptionCount >= 10) {
        evidenceScore = 1.0;
        evidenceStrength = 'Strong';
      } else if (prescriptionCount >= 5) {
        evidenceScore = 0.8;
        evidenceStrength = 'Moderate';
      } else if (prescriptionCount >= 2) {
        evidenceScore = 0.6;
        evidenceStrength = 'Weak';
      } else {
        evidenceScore = 0.4;
        evidenceStrength = 'Limited';
      }

      // 2. Clinical Support (40% weight) - Usage percentage for this diagnosis
      let totalPrescriptions = 1; // Default to prevent division by zero
      let supportScore = 0.4;
      let clinicalSupport = 'Unknown';

      try {
        const totalForDiagnosisQuery = `
          SELECT COUNT(*) as total_prescriptions
          FROM normalized_prescriptions 
          WHERE diagnosis_name = $1 AND training_eligible = true
        `;
        const totalResult = await this.dataSource.query(
          totalForDiagnosisQuery,
          [diagnosisName],
        );

        if (
          totalResult &&
          totalResult.length > 0 &&
          totalResult[0].total_prescriptions
        ) {
          totalPrescriptions = Math.max(
            parseInt(totalResult[0].total_prescriptions) || 1,
            1,
          );
        }

        const usagePercentage = (prescriptionCount / totalPrescriptions) * 100;

        if (usagePercentage >= 20.0) {
          supportScore = 1.0;
          clinicalSupport = 'Primary Choice';
        } else if (usagePercentage >= 10.0) {
          supportScore = 0.8;
          clinicalSupport = 'Common Choice';
        } else if (usagePercentage >= 5.0) {
          supportScore = 0.6;
          clinicalSupport = 'Alternative Choice';
        } else {
          supportScore = 0.4;
          clinicalSupport = 'Rare Choice';
        }
      } catch (dbError) {
        await this.errorLogService.logError(
          `Database error in calculateMedicineScore for ${medicineName}/${diagnosisName}: ${dbError.message}`,
          dbError.stack,
        );
        // Use default values and continue
      }

      // Calculate final weighted score
      const finalScore = Math.max(
        0,
        Math.min(
          1,
          evidenceScore * 0.6 + // 60% weight for evidence
            supportScore * 0.4, // 40% weight for clinical support
        ),
      );

      const usagePercentage =
        totalPrescriptions > 0
          ? (prescriptionCount / totalPrescriptions) * 100
          : 0;

      return {
        finalScore: Math.round(finalScore * 100) / 100,
        evidenceStrength,
        clinicalSupport,
        prescriptionCount,
        usagePercentage: Math.round(Math.max(0, usagePercentage) * 100) / 100,
      };
    } catch (error) {
      await this.errorLogService.logError(
        `Error calculating medicine score for ${medicineName}/${diagnosisName}: ${error.message}`,
        error.stack,
      );
      return {
        finalScore: 0.3,
        evidenceStrength: 'Error',
        clinicalSupport: 'Unknown',
        prescriptionCount: 0,
        usagePercentage: 0,
      };
    }
  }

  private async getLocalClinicalNotes(
    diagnosis: string,
    specialization?: string,
  ): Promise<string[]> {
    try {
      // Use raw SQL query instead of TypeORM QueryBuilder
      let rawQuery = `
        SELECT medical_notes
        FROM ai_diagnosis_notes 
        WHERE LOWER(diagnosis) LIKE LOWER($1) 
        AND training_eligible = true
      `;

      let parameters = [`%${diagnosis}%`];

      if (specialization) {
        rawQuery += ` AND specialty = $2`;
        parameters.push(specialization);
      }

      rawQuery += ` LIMIT 1`;

      const results = await this.dataSource.query(rawQuery, parameters);

      if (results.length > 0 && results[0].medical_notes) {
        const combinedNotes = results[0].medical_notes;
        const individualNotes = combinedNotes
          .split(';')
          .map((note: string) => note.trim())
          .filter((note: string) => note.length > 0);
        
        return individualNotes;
      }
      return [];
    } catch (error) {
      await this.errorLogService.logError(
        `Error getting local clinical notes: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }
}
