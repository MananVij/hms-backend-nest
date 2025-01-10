import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner } from 'typeorm';
import { Doctor } from './entity/doctor.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { User } from 'src/user/entity/user.enitiy';
import { UserClinicService } from 'src/user_clinic/user_clinic.service';
import { UserService } from 'src/user/user.service';
import { MetaDataService } from 'src/metadata/meta-data.service';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private readonly userService: UserService,
    private readonly metaDataService: MetaDataService,
    private readonly userClinicService: UserClinicService,
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
        user,
      });
      await queryRunner.manager.save(doctor);

      return await this.userClinicService.createUserClinic(queryRunner, {
        userId: user.uid,
        clinicId,
        role,
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Something Went Wrong.');
    }
  }
}
