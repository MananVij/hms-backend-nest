import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorPatient } from './entity/doctor_patient.entity';

@Injectable()
export class DoctorPatientService {
  constructor(
    @InjectRepository(DoctorPatient)
    private readonly doctorPatientRepository: Repository<DoctorPatient>,
  ) {}
  async findAllPatientsOfDoctorByClinicId(
    doctorId: string,
    clinicId: number,
  ): Promise<any> {
    const doctorPatients = await this.doctorPatientRepository.find({
      where: {
        doctor: { user: { uid: doctorId } },
        patient: { patientClinics: { clinic: { id: clinicId } } },
      },
      relations: ['patient', 'patient.metaData'],
    });
    const patients = doctorPatients.map((patients) => patients.patient);
    return patients;
  }
}
