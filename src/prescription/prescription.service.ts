import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, QueryRunner, Repository } from 'typeorm';
import { Prescription } from './entity/prescription.entity';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { User } from 'src/user/entity/user.enitiy';
import { ErrorLogService } from 'src/errorlog/error-log.service';
import { Appointment } from 'src/appointment/entity/appointment.entity';
import {
  UserClinic,
  UserRole,
} from 'src/user_clinic/entity/user_clinic.entity';
import { Clinic } from 'src/clininc/entity/clininc.entity';

@Injectable()
export class PrescriptionService {
  constructor(
    @InjectRepository(Prescription)
    private readonly errorLogService: ErrorLogService,
  ) {}

  async create(
    createPrescriptionDto: CreatePrescriptionDto,
    queryRunner: QueryRunner,
    doctorId: string,
    clinicId: number,
  ): Promise<Prescription> {
    try {
      const { patientId, vitalsId, appointmentId, ...prescriptionData } =
        createPrescriptionDto;

      const [doctor, patient, clinic, appointment] = await Promise.all([
        queryRunner.manager.findOne(User, {
          where: { uid: doctorId },
        }),
        queryRunner.manager.findOne(User, {
          where: { uid: patientId, isPatient: true },
        }),
        queryRunner.manager.findOne(Clinic, {
          where: { id: clinicId },
        }),
        queryRunner.manager.findOne(Appointment, {
          where: { id: appointmentId, prescription: IsNull() },
        }),
      ]);

      if (!doctor || !patient || !clinic || !appointment) {
        throw new NotFoundException(
          'Credentials not found. Something Went Wrong.',
        );
      }

      const doctorClinic = await queryRunner.manager.findOne(UserClinic, {
        where: {
          user: { uid: doctorId },
          clinic: { id: clinicId },
          role: UserRole.DOCTOR,
        },
      });

      if (!doctorClinic) {
        throw new NotFoundException('Doctor clinic relationship not found.');
      }

      if (prescriptionData?.is_final_prescription ?? false) {
        const prescription = queryRunner.manager.create(Prescription, {
          ...prescriptionData,
          appointment,
          doctor,
          patient,
        });
        await queryRunner.manager.save(prescription);
        return prescription;
      } else {
        const prescription = queryRunner.manager.create(Prescription, {
          ...prescriptionData,
          doctor,
          patient,
        });
        await queryRunner.manager.save(prescription);
        return prescription;
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      await this.errorLogService.logError(
        `Error in creating prescription: ${error.message}`,
        error.stack,
        null,
        doctorId,
        createPrescriptionDto?.patientId,
      );
      throw new InternalServerErrorException('Unable to save prescription.');
    }
  }
}
