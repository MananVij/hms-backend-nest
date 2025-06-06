import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { Doctor } from './entity/doctor.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { User } from 'src/user/entity/user.enitiy';
import { UserClinicService } from 'src/user_clinic/user_clinic.service';
import { UserService } from 'src/user/user.service';
import { MetaDataService } from 'src/metadata/meta-data.service';
import { ErrorLogService } from 'src/errorlog/error-log.service';
import { MedicalSpecialization } from './entity/specialization.enum';

@Injectable()
export class DoctorService {
  constructor(
    private readonly userService: UserService,
    private readonly metaDataService: MetaDataService,
    private readonly userClinicService: UserClinicService,
    private readonly errorLogService: ErrorLogService,
  ) {}

  async create(
    createDoctorDto: CreateDoctorDto,
    queryRunner: QueryRunner,
  ): Promise<any> {
    const { userData, clinicId, role, staffData, metaData } = createDoctorDto;

    try {
      // check if email or phone number exists
      const foundUser = await queryRunner.manager.findOne(User, {
        where: [
          { email: userData.email },
          { phoneNumber: userData.phoneNumber },
        ],
      });
      if (foundUser) {
        throw new ConflictException('Credentials already in use.');
      }

      //create user, meta-data and doctor
      const user = await this.userService.createUser(userData, queryRunner);
      await this.metaDataService.create(
        {
          ...metaData,
          uid: user.uid,
        },
        queryRunner,
      );
      const doctor = queryRunner.manager.create(Doctor, {
        ...staffData,
        specialization: staffData.specialization as MedicalSpecialization,
        user,
      });
      await queryRunner.manager.save(doctor);

      return await this.userClinicService.createUserClinic(queryRunner, {
        userId: user.uid,
        clinicId,
        role: [role],
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      await this.errorLogService.logError(
        `Unable to create staff: ${error?.mesage}`,
        error?.stack,
        null,
        null,
        null,
      );
      throw new InternalServerErrorException(
        'Something Went Wrong. Unable to create staff at the moment.',
      );
    }
  }
}
