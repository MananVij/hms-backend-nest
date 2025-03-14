import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ArrayContains, IsNull, QueryRunner } from 'typeorm';
import { Prescription } from './entity/prescription.entity';
import {
  CreatePrescriptionDto,
  MedicationDto,
} from './dto/create-prescription.dto';
import { User } from 'src/user/entity/user.enitiy';
import { ErrorLogService } from 'src/errorlog/error-log.service';
import { Appointment } from 'src/appointment/entity/appointment.entity';
import {
  UserClinic,
  UserRole,
} from 'src/user_clinic/entity/user_clinic.entity';
import { Clinic } from 'src/clininc/entity/clininc.entity';
import { DjangoService } from 'src/django/django.service';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { WhatsappTemplate } from 'src/whatsapp/whatsapp-template.enum';
import { NotificationService } from 'src/notification/notification.service';
import {
  NotificationSubTypeEnum,
  NotificationTypeEnum,
} from 'src/notification/notification.enum';

@Injectable()
export class PrescriptionService {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly whatsappService: WhatsappService,
    private readonly errorLogService: ErrorLogService,
    private readonly djangoService: DjangoService,
  ) {}

  async create(
    createPrescriptionDto: CreatePrescriptionDto,
    queryRunner: QueryRunner,
    doctorId: string,
    clinicId: number,
  ): Promise<any> {
    try {
      const { patientId, vitalsId, appointmentId, ...prescriptionData } =
        createPrescriptionDto;

      const [doctor, patient, clinic, appointment, doctorClinic] =
        await Promise.all([
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
            relations: ['doctor'],
          }),
          queryRunner.manager.findOne(UserClinic, {
            where: {
              user: { uid: doctorId },
              clinic: { id: clinicId },
              role: ArrayContains([UserRole.DOCTOR]),
            },
          }),
        ]);

      if (!doctor || !patient || !clinic || !appointment) {
        throw new NotFoundException(
          'Credentials not found. Something Went Wrong.',
        );
      }

      if (!doctorClinic) {
        throw new ForbiddenException('Doctor clinic relationship not found.');
      }
      if (appointment.doctor.uid !== doctorId) {
        throw new ForbiddenException(
          'You are not authorised to add prescription for this appointment',
        );
      }

      if (prescriptionData?.is_final_prescription ?? false) {
        const prescription = queryRunner.manager.create(Prescription, {
          ...prescriptionData,
          appointment,
          doctor,
          patient,
        });

        if (createPrescriptionDto?.followUp) {
          appointment.followUp = createPrescriptionDto.followUp;
          await queryRunner.manager.save(appointment);
          await this.notificationService.createNotification(queryRunner, {
            type: NotificationTypeEnum.WHATSAPP,
            subType: NotificationSubTypeEnum.REMINDER,
            appointmentId,
            isSent: false,
          });
        }
        
        const date = new Date();
        const whatsappNotificationId = await this.whatsappService.sendMessage(
          patient.phoneNumber,
          WhatsappTemplate.APPOINTMENT_PRESCRIPTION_TEMPLATE,
          [
            patient.name,
            doctor.name,
            clinic.name,
            `${clinic.line1}, ${clinic.line2}`,
            clinic.contactNumber,
          ],
          null,
          prescription.pres_url,
        );
        await this.notificationService.createNotification(queryRunner, {
          notificationId: whatsappNotificationId,
          type: NotificationTypeEnum.WHATSAPP,
          subType: NotificationSubTypeEnum.PRESCRIPTIION,
          appointmentId,
          isSent: true,
          timeSent: date,
        });
        const savedPrescription = await queryRunner.manager.save(prescription);
        const formattedData = {
          ...savedPrescription,
          doctor: {
            uid: savedPrescription?.doctor?.uid,
            name: savedPrescription?.doctor?.name,
          },
          patient: {
            uid: savedPrescription?.patient?.uid,
            name: savedPrescription?.patient?.name,
            phoneNumber: savedPrescription?.patient?.phoneNumber,
            address: savedPrescription?.patient?.address,
          },
          appointment: {
            id: savedPrescription?.appointment?.id,
          },
        };
        if (prescriptionData?.is_gemini_data ?? false) {
          await this.postFeeback(prescriptionData?.medication, clinicId);
        }
        return formattedData;
      } else {
        const prescription = queryRunner.manager.create(Prescription, {
          ...prescriptionData,
          doctor,
          patient,
        });
        const savedPrescription = await queryRunner.manager.save(prescription);
        const formattedData = {
          ...savedPrescription,
          doctor: {
            uid: savedPrescription?.doctor?.uid,
            name: savedPrescription?.doctor?.name,
          },
          patient: {
            uid: savedPrescription?.patient?.uid,
            name: savedPrescription?.patient?.name,
            phoneNumber: savedPrescription?.patient?.phoneNumber,
            address: savedPrescription?.patient?.address,
          },
          appointment: {
            id: savedPrescription?.appointment?.id,
          },
        };
        return formattedData;
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
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

  async postFeeback(
    medications: MedicationDto[],
    clinicId: number,
  ): Promise<any> {
    const finalMedicationData = medications.map((med) => ({
      original_name: med.original_name,
      medicine_name: med.medicine_name,
      rejected_matches: med.rejected_matches || [],
      no_match_found: med.no_match_found || false,
    }));
    try {
      const response = await this.djangoService.recordMedicineFeedback(
        finalMedicationData,
        clinicId,
      );
      return response;
    } catch (error) {
      return null;
    }
  }
}
