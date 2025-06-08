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

@Injectable()
export class CSVDataImporterService {
  private readonly logger = new Logger(CSVDataImporterService.name);
  private readonly drGambhirId = '0820ca6e-94bd-4210-8311-75906ae82e99';
  
  // Configuration for specialty and data folder
  private readonly defaultSpecialty = 'dermatology';
  private readonly dataFolder = 'dermat_data'; // Could be made configurable per specialty

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

  async importAllCSVData(specialty: string = this.defaultSpecialty): Promise<{
    chiefComplaints: number;
    medicinesDiagnoses: number;
    diagnosisNotes: number;
    normalizedPrescriptions: number;
  }> {
    this.logger.log(`Starting CSV data import for specialty: ${specialty}`);
    
    try {
      // Import each dataset
      const chiefComplaints = await this.importChiefComplaints(specialty);
      this.logger.log(`Imported ${chiefComplaints} chief complaints`);

      const medicinesDiagnoses = await this.importMedicineDiagnoses(specialty);
      this.logger.log(`Imported ${medicinesDiagnoses} medicine-diagnosis mappings`);

      const diagnosisNotes = await this.importDiagnosisNotes(specialty);
      this.logger.log(`Imported ${diagnosisNotes} diagnosis notes`);

      const normalizedPrescriptions = await this.generateNormalizedPrescriptions(specialty);
      this.logger.log(`Generated ${normalizedPrescriptions} normalized prescriptions`);

      this.logger.log(`CSV import completed successfully for specialty: ${specialty}`);
      
      return {
        chiefComplaints,
        medicinesDiagnoses,
        diagnosisNotes,
        normalizedPrescriptions,
      };
    } catch (error) {
      this.logger.error(`CSV import failed for specialty ${specialty}: ${error.message}`);
      throw error;
    }
  }

  private async importChiefComplaints(specialty: string): Promise<number> {
    const csvPath = path.join(process.cwd(), this.dataFolder, 'chief_complaints_diagnosis_mapped.csv');
    const data: any[] = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          data.push(row);
        })
        .on('end', async () => {
          try {
            let imported = 0;
            
            for (const row of data) {
              const chiefComplaint = row['Chief_Complaints']?.trim();
              
              if (!chiefComplaint) continue;

              // Collect all diagnosis columns (Diagnosis, _2, _3, _4, etc.)
              const rawDiagnoses: string[] = [];
              
              // Add the main Diagnosis column
              if (row['Diagnosis']?.trim()) {
                rawDiagnoses.push(row['Diagnosis'].trim());
              }
              
              // Add all the additional diagnosis columns (_2, _3, _4, etc.)
              for (const key of Object.keys(row)) {
                if (key.startsWith('_') && row[key]?.trim()) {
                  rawDiagnoses.push(row[key].trim());
                }
              }
              
              // Split diagnoses that contain "and" into separate diagnoses
              const expandedDiagnoses: string[] = [];
              for (const diagnosis of rawDiagnoses) {
                if (diagnosis.toLowerCase().includes(' and ')) {
                  // Split by " and " and clean up each part
                  const parts = diagnosis.split(/\s+and\s+/i).map(part => part.trim());
                  expandedDiagnoses.push(...parts);
                } else {
                  expandedDiagnoses.push(diagnosis);
                }
              }
              
              // Filter out empty diagnoses and remove duplicates
              const validDiagnoses = [...new Set(expandedDiagnoses.filter(d => d.length > 0))];
              
              if (validDiagnoses.length === 0) continue;

              this.logger.log(`Importing chief complaint: "${chiefComplaint}" with ${validDiagnoses.length} diagnoses (expanded from ${rawDiagnoses.length})`);
              this.logger.log(`Diagnoses: ${validDiagnoses.slice(0, 5).join(', ')}${validDiagnoses.length > 5 ? '...' : ''}`);

              const aiChiefComplaint = this.aiChiefComplaintRepository.create({
                chiefComplaint,
                mappedDiagnoses: validDiagnoses,
                specialty: specialty,
                doctorId: this.drGambhirId,
                confidenceScore: 100.0,
                trainingEligible: true,
              });

              await this.aiChiefComplaintRepository.save(aiChiefComplaint);
              imported++;
            }

            this.logger.log(`Imported ${imported} chief complaints`);
            resolve(imported);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  private async importMedicineDiagnoses(specialty: string): Promise<number> {
    const csvPath = path.join(process.cwd(), this.dataFolder, 'medicines_diagnosis_mapped.csv');
    const data: any[] = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          data.push(row);
        })
        .on('end', async () => {
          try {
            let imported = 0;
            
            for (const row of data) {
              const medicineName = row['Full_Medicine_Brand_Name']?.trim();
              const diagnosesString = row['Diagnoses']?.trim();
              
              if (!medicineName || !diagnosesString) continue;

              // Parse diagnoses (comma-separated, may include " and " connections)
              const diagnoses = this.parseDiagnosesString(diagnosesString);

              const aiMedicineDiagnosis = this.aiMedicineDiagnosisRepository.create({
                medicineName,
                diagnoses,
                specialty: specialty,
                doctorId: this.drGambhirId,
                confidenceScore: 100.0,
                trainingEligible: true,
                prescriptionFrequency: 1,
              });

              await this.aiMedicineDiagnosisRepository.save(aiMedicineDiagnosis);
              imported++;
            }

            this.logger.log(`Imported ${imported} medicine-diagnosis mappings`);
            resolve(imported);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  private async importDiagnosisNotes(specialty: string): Promise<number> {
    const csvPath = path.join(process.cwd(), this.dataFolder, 'diagnosis_notes_mapped.csv');
    const data: any[] = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          data.push(row);
        })
        .on('end', async () => {
          try {
            let imported = 0;
            
            for (const row of data) {
              const diagnosis = row['Diagnosis']?.trim();
              
              if (!diagnosis) continue;

              // Collect all medical note columns (Medical_Notes, _2, _3, etc.)
              const rawNotes: string[] = [];
              
              // Add the main Medical_Notes column
              if (row['Medical_Notes']?.trim()) {
                rawNotes.push(row['Medical_Notes'].trim());
              }
              
              // Add all the additional note columns (_2, _3, _4, etc.)
              for (const key of Object.keys(row)) {
                if (key.startsWith('_') && row[key]?.trim()) {
                  rawNotes.push(row[key].trim());
                }
              }
              
              // Filter out empty notes and remove duplicates
              const validNotes = [...new Set(rawNotes.filter(n => n.length > 0))];
              
              if (validNotes.length === 0) continue;

              // Combine all notes into a single string separated by semicolons
              const combinedNotes = validNotes.join('; ');

              this.logger.log(`Importing diagnosis: "${diagnosis}" with ${validNotes.length} medical notes`);
              this.logger.log(`Notes: ${validNotes.slice(0, 3).join(', ')}${validNotes.length > 3 ? '...' : ''}`);

              const aiDiagnosisNotes = this.aiDiagnosisNotesRepository.create({
                diagnosis,
                medicalNotes: combinedNotes,
                specialty: specialty,
                doctorId: this.drGambhirId,
                confidenceScore: 100.0,
                trainingEligible: true,
              });

              await this.aiDiagnosisNotesRepository.save(aiDiagnosisNotes);
              imported++;
            }

            this.logger.log(`Imported ${imported} diagnosis-notes mappings`);
            resolve(imported);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  private async generateNormalizedPrescriptions(specialty: string): Promise<number> {
    this.logger.log(`Generating normalized prescriptions from imported data for specialty: ${specialty}...`);
    
    // Get all medicine-diagnosis mappings for this specialty
    const medicineDiagnoses = await this.aiMedicineDiagnosisRepository.find({
      where: { trainingEligible: true, specialty: specialty },
    });

    // Get diagnosis notes for context for this specialty
    const diagnosisNotes = await this.aiDiagnosisNotesRepository.find({
      where: { trainingEligible: true, specialty: specialty },
    });

    const notesMap = new Map<string, string>();
    diagnosisNotes.forEach(note => {
      notesMap.set(note.diagnosis, note.medicalNotes);
    });

    let created = 0;

    for (const medDiag of medicineDiagnoses) {
      for (const diagnosis of medDiag.diagnoses) {
        const normalizedPrescription = this.normalizedPrescriptionRepository.create({
          originalEntry: `${medDiag.medicineName} for ${diagnosis}`,
          medicineName: medDiag.medicineName,
          diagnosisName: diagnosis,
          specialty: specialty,
          doctorId: this.drGambhirId,
          doctorSpecialization: specialty,
          confidenceScore: 100.0,
          normalizationMethod: NormalizationMethod.BULK_IMPORT,
          qualityScore: 95.0,
          validationStatus: ValidationStatus.APPROVED,
          trainingEligible: true,
          medicalNotes: notesMap.get(diagnosis) || null,
          createdBy: this.drGambhirId,
        });

        await this.normalizedPrescriptionRepository.save(normalizedPrescription);
        created++;
      }
    }

    this.logger.log(`Generated ${created} normalized prescriptions`);
    return created;
  }

  private parseDiagnosesString(diagnosesString: string): string[] {
    // Handle both comma-separated and " and " connected diagnoses
    const rawDiagnoses: string[] = [];
    
    // First split by comma
    const commaSplit = diagnosesString.split(',');
    
    for (const part of commaSplit) {
      rawDiagnoses.push(part.trim());
    }
    
    // Split diagnoses that contain "and" into separate diagnoses
    const expandedDiagnoses: string[] = [];
    for (const diagnosis of rawDiagnoses) {
      if (diagnosis.toLowerCase().includes(' and ')) {
        // Split by " and " and clean up each part
        const parts = diagnosis.split(/\s+and\s+/i).map(part => part.trim());
        expandedDiagnoses.push(...parts);
      } else {
        expandedDiagnoses.push(diagnosis);
      }
    }
    
    // Filter out empty diagnoses and remove duplicates
    return [...new Set(expandedDiagnoses.filter(d => d.length > 0))];
  }
} 