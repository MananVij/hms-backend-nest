import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorPatient } from './entity/doctor_patient.entity';
import { ErrorLogService } from 'src/errorlog/error-log.service';

@Injectable()
export class DoctorPatientService {
  constructor(
    @InjectRepository(DoctorPatient)
    private readonly doctorPatientRepository: Repository<DoctorPatient>,

    private readonly errorLogService: ErrorLogService,
  ) {}
  async findAllPatientsOfDoctorByClinicId(
    doctorId: string,
    clinicId: number,
  ): Promise<any> {
    try {
      const doctorPatients = await this.doctorPatientRepository.find({
        where: {
          doctor: { user: { uid: doctorId } },
          patient: { patientClinics: { clinic: { id: clinicId } } },
        },
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
      const patients = doctorPatients.map((patients) => patients.patient);
      return patients;
    } catch (error) {
      await this.errorLogService.logError(
        `Unable to find all patients of doctor by clinic id: ${error?.message}`,
        error?.stack,
        null,
        doctorId,
        null,
      );
      throw new InternalServerErrorException(
        'Something went wrong. Unable to find patients of doctor at this moment.',
      );
    }
  }
}
