import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';
import { AIChiefComplaint } from '../entity/ai-chief-complaint.entity';
import { AIMedicineDiagnosis } from '../entity/ai-medicine-diagnosis.entity';
import { AIDiagnosisNotes } from '../entity/ai-diagnosis-notes.entity';
import { 
  NormalizedPrescription, 
  NormalizationMethod,
  ValidationStatus 
} from '../entity/normalized-prescription.entity';
import { MedicalSpecialization } from '../../doctor/entity/specialization.enum';

@Injectable()
export class CSVDataImporterService {
  private readonly logger = new Logger(CSVDataImporterService.name);
  
  // Configuration for data folder
  private readonly dataFolder = 'all_data';

  // Specialization mapping from CSV to enum
  private readonly specializationMapping: Record<string, string> = {
    'General Practice': MedicalSpecialization.GENERAL_PRACTICE,
    'Cardiology': MedicalSpecialization.CARDIOLOGY,
    'Neurology': MedicalSpecialization.NEUROLOGY,
    'Gastroenterology': MedicalSpecialization.GASTROENTEROLOGY,
    'Pulmonology': MedicalSpecialization.PULMONOLOGY,
    'Nephrology': MedicalSpecialization.NEPHROLOGY,
    'Endocrinology': MedicalSpecialization.ENDOCRINOLOGY,
    'Rheumatology': MedicalSpecialization.RHEUMATOLOGY,
    'Hematology': MedicalSpecialization.HEMATOLOGY,
    'Oncology': MedicalSpecialization.ONCOLOGY,
    'Infectious Disease': MedicalSpecialization.INFECTIOUS_DISEASE,
    'Geriatrics': MedicalSpecialization.GERIATRICS,
    'Palliative Care': MedicalSpecialization.PALLIATIVE_CARE,
    'Pediatrics': MedicalSpecialization.PEDIATRICS,
    'Gynecology': MedicalSpecialization.GYNECOLOGY,
    'Psychiatry': MedicalSpecialization.PSYCHIATRY,
    'Dermatology': MedicalSpecialization.DERMATOLOGY,
    'Ophthalmology': MedicalSpecialization.OPHTHALMOLOGY,
    'Otolaryngology': MedicalSpecialization.OTOLARYNGOLOGY,
    'Urology': MedicalSpecialization.UROLOGY,
    'Allergy Immunology': MedicalSpecialization.ALLERGY_IMMUNOLOGY,
    'Pain Management': MedicalSpecialization.PAIN_MANAGEMENT,
    'Sleep Medicine': MedicalSpecialization.SLEEP_MEDICINE,
    'Occupational Medicine': MedicalSpecialization.OCCUPATIONAL_MEDICINE,
    'Preventive Medicine': MedicalSpecialization.PREVENTIVE_MEDICINE
  };

  constructor(
    @InjectRepository(AIChiefComplaint)
    private aiChiefComplaintRepository: Repository<AIChiefComplaint>,
    @InjectRepository(AIMedicineDiagnosis)
    private aiMedicineDiagnosisRepository: Repository<AIMedicineDiagnosis>,
    @InjectRepository(AIDiagnosisNotes)
    private aiDiagnosisNotesRepository: Repository<AIDiagnosisNotes>,
    @InjectRepository(NormalizedPrescription)
    private normalizedPrescriptionRepository: Repository<NormalizedPrescription>,
  ) {}

  async importAllCSVData(
    requestedSpecialty: string = 'all',
    doctorId?: string
  ): Promise<{
    chiefComplaints: number;
    medicinesDiagnoses: number;
    diagnosisNotes: number;
    normalizedPrescriptions: number;
    specializations: string[];
  }> {
    this.logger.log(`Starting CSV data import for: ${requestedSpecialty}`);
    
    const defaultDoctorId = doctorId || '0820ca6e-94bd-4210-8311-75906ae82e99';
    
    try {
      // Clear existing data if importing all specializations
      if (requestedSpecialty === 'all') {
        await this.clearExistingData();
      }

      // Import each dataset
      const chiefComplaints = await this.importChiefComplaints(requestedSpecialty, defaultDoctorId);
      this.logger.log(`Imported ${chiefComplaints} chief complaints`);

      const medicinesDiagnoses = await this.importMedicineDiagnoses(requestedSpecialty, defaultDoctorId);
      this.logger.log(`Imported ${medicinesDiagnoses} medicine-diagnosis mappings`);

      const diagnosisNotes = await this.importDiagnosisNotes(requestedSpecialty, defaultDoctorId);
      this.logger.log(`Imported ${diagnosisNotes} diagnosis notes`);

      const normalizedPrescriptions = await this.generateNormalizedPrescriptions(requestedSpecialty, defaultDoctorId);
      this.logger.log(`Generated ${normalizedPrescriptions} normalized prescriptions`);

      const specializations = Object.values(this.specializationMapping);
      this.logger.log(`CSV import completed successfully for: ${requestedSpecialty}`);
      
      return {
        chiefComplaints,
        medicinesDiagnoses,
        diagnosisNotes,
        normalizedPrescriptions,
        specializations,
      };
    } catch (error) {
      this.logger.error(`CSV import failed for ${requestedSpecialty}: ${error.message}`);
      throw error;
    }
  }

  private async clearExistingData(): Promise<void> {
    this.logger.log('Clearing existing AI training data...');
    
    try {
      await this.normalizedPrescriptionRepository.delete({ trainingEligible: true });
      await this.aiDiagnosisNotesRepository.delete({ trainingEligible: true });
      await this.aiMedicineDiagnosisRepository.delete({ trainingEligible: true });
      await this.aiChiefComplaintRepository.delete({ trainingEligible: true });
      
      this.logger.log('✅ Existing AI training data cleared');
    } catch (error) {
      this.logger.error(`Error clearing existing data: ${error.message}`);
      throw error;
    }
  }

  private mapSpecialization(csvSpecialization: string): string {
    const mapped = this.specializationMapping[csvSpecialization];
    if (!mapped) {
      this.logger.warn(`Unknown specialization: ${csvSpecialization}, using as-is`);
      return csvSpecialization.toLowerCase().replace(/\s+/g, '_');
    }
    return mapped;
  }

  private shouldProcessSpecialization(csvSpecialization: string, requestedSpecialty: string): boolean {
    if (requestedSpecialty === 'all') return true;
    
    const normalizedRequested = requestedSpecialty.toLowerCase().replace(/\s+/g, '_');
    const mappedSpecialization = this.mapSpecialization(csvSpecialization);
    
    return mappedSpecialization === normalizedRequested;
  }

  private async importChiefComplaints(requestedSpecialty: string, doctorId: string): Promise<number> {
    const csvPath = path.join(process.cwd(), this.dataFolder, 'complaints_diagnosis_mapped.csv');
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found: ${csvPath}`);
    }

    const data: any[] = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv({ headers: false }))
        .on('data', (row) => {
          data.push(row);
        })
        .on('end', async () => {
          try {
            let imported = 0;
            
            for (let i = 1; i < data.length; i++) {
              const row = data[i];
              const csvSpecialization = row['0']?.trim();
              const chiefComplaint = row['1']?.trim();
              
              if (!csvSpecialization || !chiefComplaint) continue;
              if (!this.shouldProcessSpecialization(csvSpecialization, requestedSpecialty)) continue;

              const mappedSpecialization = this.mapSpecialization(csvSpecialization);

              const rawDiagnoses: string[] = [];
              
              for (let colIndex = 2; colIndex < 50; colIndex++) {
                const diagnosis = row[colIndex.toString()]?.trim();
                if (diagnosis && diagnosis.length > 0) {
                  rawDiagnoses.push(diagnosis);
                }
              }
              
              const validDiagnoses = this.parseAndExpandDiagnoses(rawDiagnoses);
              
              if (validDiagnoses.length === 0) continue;

              this.logger.log(`[${csvSpecialization}] Importing chief complaint: "${chiefComplaint}" with ${validDiagnoses.length} diagnoses`);
              this.logger.log(`  Diagnoses: ${validDiagnoses.slice(0, 5).join(', ')}${validDiagnoses.length > 5 ? '...' : ''}`);

              const aiChiefComplaint = this.aiChiefComplaintRepository.create({
                chiefComplaint,
                mappedDiagnoses: validDiagnoses,
                specialty: mappedSpecialization,
                doctorId: doctorId,
                confidenceScore: 100.0,
                trainingEligible: true,
              });

              await this.aiChiefComplaintRepository.save(aiChiefComplaint);
              imported++;
            }

            this.logger.log(`✅ Imported ${imported} chief complaints`);
            resolve(imported);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  private async importMedicineDiagnoses(requestedSpecialty: string, doctorId: string): Promise<number> {
    const csvPath = path.join(process.cwd(), this.dataFolder, 'medicine_diagnosis_mapped.csv');
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found: ${csvPath}`);
    }

    const data: any[] = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv({ headers: false }))
        .on('data', (row) => {
          data.push(row);
        })
        .on('end', async () => {
          try {
            let imported = 0;
            
            for (let i = 1; i < data.length; i++) {
              const row = data[i];
              const csvSpecialization = row['0']?.trim();
              const medicineName = row['1']?.trim();
              
              if (!csvSpecialization || !medicineName) continue;
              if (!this.shouldProcessSpecialization(csvSpecialization, requestedSpecialty)) continue;

              const mappedSpecialization = this.mapSpecialization(csvSpecialization);

              const rawDiagnoses: string[] = [];
              
              for (let colIndex = 2; colIndex < 50; colIndex++) {
                const diagnosis = row[colIndex.toString()]?.trim();
                if (diagnosis && diagnosis.length > 0) {
                  rawDiagnoses.push(diagnosis);
                }
              }
              
              const validDiagnoses = this.parseAndExpandDiagnoses(rawDiagnoses);
              
              if (validDiagnoses.length === 0) continue;

              this.logger.log(`[${csvSpecialization}] Importing medicine: "${medicineName}" with ${validDiagnoses.length} diagnoses`);
              this.logger.log(`  Diagnoses: ${validDiagnoses.slice(0, 5).join(', ')}${validDiagnoses.length > 5 ? '...' : ''}`);

              const aiMedicineDiagnosis = this.aiMedicineDiagnosisRepository.create({
                medicineName,
                diagnoses: validDiagnoses,
                specialty: mappedSpecialization,
                doctorId: doctorId,
                confidenceScore: 100.0,
                trainingEligible: true,
                prescriptionFrequency: 1,
              });

              await this.aiMedicineDiagnosisRepository.save(aiMedicineDiagnosis);
              imported++;
            }

            this.logger.log(`✅ Imported ${imported} medicine-diagnosis mappings`);
            resolve(imported);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  private async importDiagnosisNotes(requestedSpecialty: string, doctorId: string): Promise<number> {
    const csvPath = path.join(process.cwd(), this.dataFolder, 'diagnosis_notes_mapped.csv');
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found: ${csvPath}`);
    }

    const data: any[] = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv({ headers: false }))
        .on('data', (row) => {
          data.push(row);
        })
        .on('end', async () => {
          try {
            let imported = 0;
            
            for (let i = 1; i < data.length; i++) {
              const row = data[i];
              const csvSpecialization = row['0']?.trim();
              const diagnosis = row['1']?.trim();
              
              if (!csvSpecialization || !diagnosis) continue;
              if (!this.shouldProcessSpecialization(csvSpecialization, requestedSpecialty)) continue;

              const mappedSpecialization = this.mapSpecialization(csvSpecialization);

              const rawNotes: string[] = [];
              
              for (let colIndex = 2; colIndex < 50; colIndex++) {
                const note = row[colIndex.toString()]?.trim();
                if (note && note.length > 0) {
                  rawNotes.push(note);
                }
              }
              
              const validNotes = [...new Set(rawNotes.filter(n => n.length > 0))];
              
              if (validNotes.length === 0) continue;

              const combinedNotes = validNotes.join('; ');

              this.logger.log(`[${csvSpecialization}] Importing diagnosis: "${diagnosis}" with ${validNotes.length} medical notes`);

              const aiDiagnosisNotes = this.aiDiagnosisNotesRepository.create({
                diagnosis,
                medicalNotes: combinedNotes,
                specialty: mappedSpecialization,
                doctorId: doctorId,
                confidenceScore: 100.0,
                trainingEligible: true,
              });

              await this.aiDiagnosisNotesRepository.save(aiDiagnosisNotes);
              imported++;
            }

            this.logger.log(`✅ Imported ${imported} diagnosis-notes mappings`);
            resolve(imported);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  private async generateNormalizedPrescriptions(requestedSpecialty: string, doctorId: string): Promise<number> {
    this.logger.log(`Generating normalized prescriptions from imported data...`);
    
    const whereCondition = requestedSpecialty === 'all' 
      ? { trainingEligible: true }
      : { trainingEligible: true, specialty: this.mapSpecialization(requestedSpecialty) };

    const medicineDiagnoses = await this.aiMedicineDiagnosisRepository.find({
      where: whereCondition,
    });

    const diagnosisNotes = await this.aiDiagnosisNotesRepository.find({
      where: whereCondition,
    });

    const notesMap = new Map<string, string>();
    diagnosisNotes.forEach(note => {
      notesMap.set(`${note.specialty}:${note.diagnosis}`, note.medicalNotes);
    });

    let created = 0;

    for (const medDiag of medicineDiagnoses) {
      for (const diagnosis of medDiag.diagnoses) {
        const normalizedPrescription = this.normalizedPrescriptionRepository.create({
          originalEntry: `${medDiag.medicineName} for ${diagnosis}`,
          medicineName: medDiag.medicineName,
          diagnosisName: diagnosis,
          specialty: medDiag.specialty,
          doctorId: doctorId,
          doctorSpecialization: medDiag.specialty,
          confidenceScore: 100.0,
          normalizationMethod: NormalizationMethod.BULK_IMPORT,
          qualityScore: 95.0,
          validationStatus: ValidationStatus.APPROVED,
          trainingEligible: true,
          medicalNotes: notesMap.get(`${medDiag.specialty}:${diagnosis}`) || null,
          createdBy: doctorId,
        });

        await this.normalizedPrescriptionRepository.save(normalizedPrescription);
        created++;
      }
    }

    this.logger.log(`✅ Generated ${created} normalized prescriptions`);
    return created;
  }

  private parseAndExpandDiagnoses(rawDiagnoses: string[]): string[] {
    const expandedDiagnoses: string[] = [];
    
    for (const diagnosisString of rawDiagnoses) {
      if (!diagnosisString || diagnosisString.trim().length === 0) continue;
      
      const commaSeparated = diagnosisString.split(',').map(d => d.trim()).filter(d => d.length > 0);
      
      for (const part of commaSeparated) {
        if (part.toLowerCase().includes(' and ')) {
          const andSeparated = part.split(/\s+and\s+/i).map(p => p.trim()).filter(p => p.length > 0);
          expandedDiagnoses.push(...andSeparated);
        } else {
          expandedDiagnoses.push(part);
        }
      }
    }
    
    return [...new Set(expandedDiagnoses.filter(d => d && d.length > 0))];
  }
} 