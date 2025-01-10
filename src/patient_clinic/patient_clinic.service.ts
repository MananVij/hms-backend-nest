import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Clinic } from 'src/clininc/entity/clininc.entity';
import { User } from 'src/user/entity/user.enitiy';
import { QueryRunner, Repository } from 'typeorm';
import { PatientClinic } from './entity/patient_clinic.entity';
import { CreatePatientClinicDto } from './dto/patinet_clinic.dto';
import { ErrorLogService } from 'src/errorlog/error-log.service';

@Injectable()
export class PatientClinicService {
  constructor(
    @InjectRepository(PatientClinic)
    private readonly patientClinicRepository: Repository<PatientClinic>,

    private readonly errorLogService: ErrorLogService,
  ) {}

  // Create a new user-clinic association
  async createPatientClinicRelationship(
    createUserClinicDto: CreatePatientClinicDto,
    queryRunner: QueryRunner,
  ): Promise<PatientClinic> {
    const { patientId, clinicId } = createUserClinicDto;
    try {
      const [patient, clinic] = await Promise.all([
        queryRunner.manager.findOne(User, {
          where: { uid: patientId, isPatient: true },
          relations: ['metaData'],
          select: {
            uid: true,
            name: true,
            phoneNumber: true,
            metaData: {
              dob: true,
              sex: true,
            },
            address: {
              line1: true,
              line2: true,
            },
          },
        }),
        queryRunner.manager.findOne(Clinic, { where: { id: clinicId } }),
      ]);
      const userClinic = this.patientClinicRepository.create({
        patient,
        clinic,
      });
      return await queryRunner.manager.save(userClinic);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Something Went Wrong.');
    }
  }

  async checkPatientClinicRelationship(
    patientId: string,
    clinicId: number,
    queryRunner: QueryRunner,
  ) {
    try {
      const [patient, clinic] = await Promise.all([
        queryRunner.manager.findOne(User, { where: { uid: patientId } }),
        queryRunner.manager.findOne(Clinic, { where: { id: clinicId } }),
      ]);

      if (!patient) {
        throw new NotFoundException('Patient not found');
      }

      if (!clinic) {
        throw new NotFoundException('Clinic not found');
      }

      const existingRelation = await queryRunner.manager.findOne(
        PatientClinic,
        {
          where: { patient: { uid: patientId }, clinic: { id: clinicId } },
        },
      );
      return existingRelation;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Something went wrong.');
    }
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
