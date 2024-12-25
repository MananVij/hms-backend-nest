import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Clinic } from 'src/clininc/entity/clininc.entity';
import { User } from 'src/user/entity/user.enitiy';
import { Repository } from 'typeorm';
import { PatientClinic } from './entity/patient_clinic.entity';
import { CreatePatientClinicDto } from './dto/patinet_clinic.dto';
import { ErrorLogService } from 'src/errorlog/error-log.service';

@Injectable()
export class PatientClinicService {
  constructor(
    @InjectRepository(PatientClinic)
    private readonly patientClinicRepository: Repository<PatientClinic>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Clinic)
    private readonly clinicRepository: Repository<Clinic>,

    private readonly errorLogService: ErrorLogService,
  ) {}

  // Create a new user-clinic association
  async createPatientClinicRelationship(
    createUserClinicDto: CreatePatientClinicDto,
  ): Promise<PatientClinic> {
    const { patientId, clinicId } = createUserClinicDto;

    const [patient, clinic] = await Promise.all([
      this.userRepository.findOne({ where: { uid: patientId } }),
      this.clinicRepository.findOne({ where: { id: clinicId } }),
    ]);

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    const existingRelation = await this.patientClinicRepository.findOne({
      where: { patient: { uid: patientId }, clinic: { id: clinicId } },
    });
    if (!existingRelation) {
      const userClinic = this.patientClinicRepository.create({
        patient,
        clinic,
      });
      return await this.patientClinicRepository.save(userClinic);
    }
    return existingRelation;
  }

  async findAllPatientsByClinicIdOfAdmin(clinicId: number): Promise<User[]> {
    try {
      const clinicPatients = await this.patientClinicRepository.find({
        where: { clinic: { id: clinicId } },
        relations: ['patient', 'patient.metaData'],
        select: {
          patient: {
            uid: true,
            name: true,
            phoneNumber: true,
            metaData: {
              dob: true,
              sex: true,
            },
          },
        },
      });
      if (!clinicPatients) {
        return [];
      }
      const patients = clinicPatients.map((user) => user.patient);
      return patients;
    } catch (error) {
      await this.errorLogService.logError(
        `Error in finding patients of clinic: ${error.message}`,
        error.stack,
        null,
        null,
        null,
      );
      throw new Error('Something Went Wrong!');
    }
  }
}
