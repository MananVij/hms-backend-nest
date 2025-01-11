import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { Vitals } from './entity/vitals.entity';
import { CreateVitalsDto } from './dto/create-vitals.dto';
import { User } from 'src/user/entity/user.enitiy';
import { ErrorLogService } from 'src/errorlog/error-log.service';
import { Appointment } from 'src/appointment/entity/appointment.entity';

@Injectable()
export class VitalsService {
  constructor(private readonly errorLogService: ErrorLogService) {}

  async createVitals(
    queryRunner: QueryRunner,
    staffId: string,
    createVitalsDto: CreateVitalsDto,
  ): Promise<any> {
    try {
      const { patientId, appointmentId, ...vitalsData } = createVitalsDto;

      const [user, staff, appointment] = await Promise.all([
        queryRunner.manager.findOne(User, {
          where: { uid: patientId, isPatient: true },
        }),
        queryRunner.manager.findOne(User, {
          where: { uid: staffId },
        }),
        queryRunner.manager.findOne(Appointment, {
          where: { id: appointmentId },
        }),
      ]);
      if (!user) {
        throw new NotFoundException(`User not found`);
      }

      if (!staff) {
        throw new NotFoundException(`Staff not found`);
      }

      if (!appointment) {
        throw new NotFoundException(`Appointment not found`);
      }

      const vitals = queryRunner.manager.create(Vitals, {
        ...vitalsData,
        createdBy: staff,
        appointment,
        patiet: user,
      });

      appointment.vitals = vitals;
      await queryRunner.manager.save([vitals, appointment]);
      const formattedData = {
        id: vitals?.id,
        bp: vitals?.bp,
        weight: vitals?.weight,
        pulse: vitals?.pulse,
        temp: vitals?.temp,
        oxy: vitals?.oxy,
      };
      return formattedData;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      await this.errorLogService.logError(
        error?.message,
        error.stack,
        null,
        staffId,
        createVitalsDto?.patientId,
      );
      throw error;
    }
  }
}
