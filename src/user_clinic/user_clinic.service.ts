import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { UserClinic } from './entity/user_clinic.entity';
import { Clinic } from 'src/clininc/entity/clininc.entity';
import { User } from 'src/user/entity/user.enitiy';
import { CreateUserClinicDto } from './dto/create_user_clinic.dto';
import { ErrorLogService } from 'src/errorlog/error-log.service';

@Injectable()
export class UserClinicService {
  constructor(
    @InjectRepository(UserClinic)
    private readonly userClinicRepository: Repository<UserClinic>,
    private readonly errorLogService: ErrorLogService,
  ) {}

  async createUserClinic(
    queryRunner: QueryRunner,
    createUserClinicDto: CreateUserClinicDto,
  ): Promise<any> {
    const { userId, clinicId, role } = createUserClinicDto;
    try {
      const [user, clinic, existingRelationship] = await Promise.all([
        queryRunner.manager.findOne(User, {
          where: { uid: userId },
          relations: ['doctor'],
        }),
        queryRunner.manager.findOne(Clinic, { where: { id: clinicId } }),
        queryRunner.manager.findOne(UserClinic, {
          where: { clinic: { id: clinicId }, user: { uid: userId }, role },
        }),
      ]);

      if (!user) {
        throw new NotFoundException('User Not Found');
      }

      if (!clinic) {
        throw new NotFoundException('Clinic Not Found');
      }

      if (existingRelationship) {
        throw new ConflictException(
          `Staff Already Linked to Clinic for ${role} role.`,
        );
      }

      const userClinic = queryRunner.manager.create(UserClinic, {
        user,
        clinic,
        role,
      });
      const savedUserClinic = await queryRunner.manager.save(userClinic);
      const formattedData = {
        role: savedUserClinic.role,
        user: {
          id: savedUserClinic.user.uid,
          name: savedUserClinic.user.name,
          email: savedUserClinic.user.email,
          phoneNumber: savedUserClinic.user.phoneNumber,
          address: {
            line1: savedUserClinic.user.address.line1,
            line2: savedUserClinic.user.address.line2,
            pincode: savedUserClinic.user.address.pincode,
          },
          doctor: {
            id: savedUserClinic.user.doctor.id,
            fee: savedUserClinic.user.doctor.fee,
            licenseNumber: savedUserClinic.user.doctor.licenseNumber,
            qualification: savedUserClinic.user.doctor.qualification,
            specialization: savedUserClinic.user.doctor.specialization,
          },
        },
      };
      return formattedData;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      await this.errorLogService.logError(
        `Error in creating user-clinic realtionship: ${error.message}`,
        error.stack,
        null,
        userId,
        null,
      );
      throw new InternalServerErrorException('Something Went Wrong.');
    }
  }

  async findUserRoleInClinic(
    queryRunner: QueryRunner,
    userId: string,
    clinicId: number,
  ): Promise<string> {
    try {
      const [user, clinic] = await Promise.all([
        queryRunner.manager.findOne(User, {
          where: { uid: userId },
        }),
        queryRunner.manager.findOne(Clinic, {
          where: { id: clinicId },
        }),
      ]);
      if (!user) {
        throw new NotFoundException('Doctor not found');
      }

      if (!clinic) {
        throw new NotFoundException('Clinic not found');
      }
      const userClinic = await this.userClinicRepository.findOne({
        where: { user: { uid: userId }, clinic: { id: clinicId } },
      });
      return userClinic.role;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async findStaffOfClinic(
    clinicId: number,
    roleCondition: object,
  ): Promise<UserClinic[]> {
    try {
      const userClinic = await this.userClinicRepository.find({
        where: { clinic: { id: clinicId }, ...roleCondition },
        relations: ['user', 'user.doctor'],
        select: {
          role: true,
          user: {
            uid: true,
            name: true,
            email: true,
            phoneNumber: true,
            address: {
              line1: true,
              line2: true,
              pincode: true,
            },
            doctor: {
              id: true,
              fee: true,
              licenseNumber: true,
              qualification: true,
              specialization: true,
            },
          },
        },
      });
      return userClinic;
    } catch (error) {
      throw new InternalServerErrorException(
        'Unble to Fetch Staff of Clinic. Something Went Wrong',
      );
    }
  }

  async findClinicsOfUser(userId: string): Promise<any[]> {
    try {
      const userClinics = await this.userClinicRepository.find({
        where: { user: { uid: userId } },
        relations: ['clinic'],
        order: {
          created_at: 'ASC',
        },
        select: {
          role: true,
          clinic: {
            id: true,
            name: true,
            contactNumber: true,
            line1: true,
            line2: true,
          },
        },
      });
      const clinics = userClinics.map((userClinic) => ({
        role: userClinic.role,
        ...userClinic.clinic,
      }));

      return clinics;
    } catch (error) {
      await this.errorLogService.logError(
        error.message,
        error.stack,
        null,
        userId,
        null,
      );
      throw new InternalServerErrorException(
        'Unable to fetch clinics. Something went wrong.',
      );
    }
  }
}
