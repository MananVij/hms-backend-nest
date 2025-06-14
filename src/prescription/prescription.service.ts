import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ArrayContains, Between, IsNull, Not, QueryRunner } from 'typeorm';
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
import { subMinutes } from 'date-fns';
import { PrescriptionValidator } from 'src/validation/validation-util';

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
          is_pres_edited: false,
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

        await this.sendPrescriptionViaWhatsapp(
          queryRunner,
          patient,
          doctor,
          clinic,
          prescription,
          appointmentId,
        ).catch((error) => {});

        const validatedPrescriptionData =
          PrescriptionValidator.validatePrescriptionData(prescription);
        Object.assign(prescription, validatedPrescriptionData);

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
        if (
          (prescriptionData?.is_voice_rx ?? false) &&
          (prescriptionData?.is_gemini_data ?? false)
        ) {
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

  async findRecentPrescriptions(
    queryRunner: QueryRunner,
    userId: string,
    clincId: number,
    role: string[],
  ): Promise<any> {
    try {
      const time = new Date();

      // last 15 minutes prescriptions
      const fifteenMinutesAgo = subMinutes(time, 15);
      const selectCondition = {
        patient: {
          name: true,
          uid: true,
          publicIdentifier: true,
          phoneNumber: true,
        },
        doctor: {
          name: true,
        },
        prescription: {
          created_at: true,
        },
        clinic: {
          id: true,
        },
        id: true,
      };
      if (
        role?.includes(UserRole.ADMIN) ||
        role.includes(UserRole.RECEPTIONIST)
      ) {
        return await queryRunner.manager.find(Appointment, {
          where: {
            prescription: { created_at: Between(fifteenMinutesAgo, time) },
            doctor: { clinics: { id: clincId } },
          },
          select: {
            ...selectCondition,
          },
          relations: ['prescription', 'doctor', 'clinic', 'patient'],
          loadRelationIds: {
            relations: ['clinic'],
          },
        });
      } else if (role?.length === 1 && role?.includes(UserRole.DOCTOR)) {
        return await queryRunner.manager.find(Appointment, {
          where: {
            doctor: { uid: userId },
            clinic: { id: clincId },
            prescription: { created_at: Between(fifteenMinutesAgo, time) },
          },
          select: {
            ...selectCondition,
          },
          relations: ['prescription', 'doctor', 'clinic', 'patient'],
          loadRelationIds: {
            relations: ['clinic'],
          },
        });
      }
    } catch (error) {
      await this.errorLogService.logError(
        `Error in finding recent prescriptions: ${error?.message}`,
        error?.stack ?? '',
        null,
        userId,
        null,
      );
      throw new InternalServerErrorException(
        'Somthing Went Wrong. Unable to find recent prescriptions at the moment.',
      );
    }
  }

  async editPrescription(
    queryRunner: QueryRunner,
    prescriptionId: number,
    updatePrescriptionDto: CreatePrescriptionDto,
    doctorId: string,
    clinicId: number,
  ): Promise<any> {
    try {
      const { patientId, appointmentId } = updatePrescriptionDto;
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
            where: { id: appointmentId, prescription: Not(IsNull()) },
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

      const prescription = await queryRunner.manager.findOne(Prescription, {
        where: { id: prescriptionId },
        relations: ['doctor', 'appointment', 'appointment.clinic'],
      });

      if (!doctor || !patient || !clinic || !appointment || !prescription) {
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

      if (prescription.appointment.clinic.id !== Number(clinicId)) {
        throw new ForbiddenException('Clinic mismatch. Unauthorized action.');
      }

      const createdAt = new Date(prescription.created_at);
      const now = new Date();
      const diffMinutes = (now.getTime() - createdAt.getTime()) / 60000;

      if (diffMinutes > 1440) {
        throw new ForbiddenException(
          'Prescription can only be edited within 1 day of creation.',
        );
      }

      const validatedPrescriptionData =
        PrescriptionValidator.validatePrescriptionData(updatePrescriptionDto);
      Object.assign(prescription, validatedPrescriptionData);
      prescription.is_pres_edited = true;
      prescription.edited_at = new Date();

      await this.sendPrescriptionViaWhatsapp(
        queryRunner,
        patient,
        doctor,
        clinic,
        prescription,
        appointmentId,
      ).catch((error) => {});
      const updatedPrescription = await queryRunner.manager.save(prescription);
      return updatedPrescription;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      await this.errorLogService.logError(
        `Error in updating prescription: ${error?.message}`,
        error?.stack,
        null,
        doctorId,
        updatePrescriptionDto?.patientId,
      );
      throw new InternalServerErrorException('Unable to edit prescription.');
    }
  }

  private async sendPrescriptionViaWhatsapp(
    queryRunner: QueryRunner,
    patient: User,
    doctor: User,
    clinic: Clinic,
    prescription: Prescription,
    appointmentId: number,
  ) {
    const date = new Date();
    try {
      if (!prescription.pres_url) {
        throw new Error('Prescription URL is missing');
      }

      const whatsappNotificationId = await this.whatsappService.sendMessage(
        patient.phoneNumber,
        WhatsappTemplate.APPOINTMENT_PRESCRIPTION_TEMPLATE,
        [
          patient.name,
          `Dr. ${doctor.name}`,
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
    } catch (error) {}
  }
}
