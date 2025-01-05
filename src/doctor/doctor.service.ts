import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { Doctor } from './entity/doctor.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { User } from 'src/user/entity/user.enitiy';
import { DoctorClinicService } from 'src/doctor_clinic/doctor-clinic.service';
import { UserService } from 'src/user/user.service';
import { MetaDataService } from 'src/metadata/meta-data.service';
import { ClinicService } from 'src/clininc/clinic.service';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,

    private readonly userService: UserService,
    private readonly metaDataService: MetaDataService,
    private readonly doctorClinicService: DoctorClinicService,
    private readonly clinicService: ClinicService,
  ) {}

  async create(
    createDoctorDto: CreateDoctorDto,
    queryRunner: QueryRunner,
  ): Promise<any> {
    const { userData, clinicId, staffData, metaData } = createDoctorDto;
    try {
      const foundUser = await queryRunner.manager.findOne(User, {
        where: [
          { email: userData.email },
          { phoneNumber: userData.phoneNumber },
        ],
      });
      if (foundUser) {
        throw new ConflictException('Credentials already in use.');
      }

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
      const createdDoctor = await queryRunner.manager.save(doctor);
      await this.doctorClinicService.create(
        createdDoctor.user.uid,
        clinicId,
        queryRunner,
      );
      const returnData = {
        ...createdDoctor,
        user: {
          uid: user.uid,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          address: {
            line1: user.address.line1,
            line2: user.address.line2,
            pincode: user.address.pincode,
          },
        },
      };
      return returnData;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Something Went Wrong.');
    }
  }

  async findDoctor(id: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { user: { uid: id } },
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }
    return doctor;
  }

  async findDoctorsByClinicId(id: number): Promise<any> {
    const doctorData = await this.doctorRepository.find({
      where: { doctorClinics: { clinic: { id } } },
      relations: ['user'],
      select: {
        user: {
          uid: true,
          name: true,
          email: true,
          phoneNumber: true,
          role: true,
          address: {
            line1: true,
            line2: true,
            pincode: true,
          },
        },
      },
    });
    const clinicData = await this.clinicService.findOne(id);
    return { doctorData, clinicData };
  }
}
