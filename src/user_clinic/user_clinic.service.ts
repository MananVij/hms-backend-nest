import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayContains, QueryRunner, Repository } from 'typeorm';
import { UserClinic, UserRole } from './entity/user_clinic.entity';
import { Clinic } from 'src/clininc/entity/clininc.entity';
import { User } from 'src/user/entity/user.enitiy';
import { CreateUserClinicDto } from './dto/create_user_clinic.dto';
import { ErrorLogService } from 'src/errorlog/error-log.service';
import { AddRoleToAdminDto } from 'src/doctor/dto/add-role.dto';
import { MetaData } from 'src/metadata/entity/metadata.entity';
import { Doctor } from 'src/doctor/entity/doctor.entity';

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
          where: {
            clinic: { id: clinicId },
            user: { uid: userId },
            role: ArrayContains(role),
          },
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
        role: role,
      });
      const savedUserClinic = await queryRunner.manager.save(userClinic);
      const formattedData = {
        role: savedUserClinic?.role,
        user: {
          id: savedUserClinic?.user?.uid,
          name: savedUserClinic?.user?.name,
          email: savedUserClinic?.user?.email,
          phoneNumber: savedUserClinic?.user?.phoneNumber,
          doctor: {
            id: savedUserClinic?.user?.doctor?.id,
            fee: savedUserClinic?.user?.doctor?.fee,
            licenseNumber: savedUserClinic?.user?.doctor?.licenseNumber,
            qualification: savedUserClinic?.user?.doctor?.qualification,
            specialization: savedUserClinic?.user?.doctor?.specialization,
          },
          clinic: {
            line1: savedUserClinic?.clinic?.line1,
            line2: savedUserClinic?.clinic?.line2,
            pincode: savedUserClinic?.clinic?.pincode,
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

  async findUserRolesInClinic(
    queryRunner: QueryRunner,
    userId: string,
    clinicId: number,
  ): Promise<UserRole[]> {
    try {
      const [user, clinic, userClinic] = await Promise.all([
        queryRunner.manager.findOne(User, {
          where: { uid: userId },
        }),
        queryRunner.manager.findOne(Clinic, {
          where: { id: clinicId },
        }),
        queryRunner.manager.findOne(UserClinic, {
          where: { user: { uid: userId }, clinic: { id: clinicId } },
        }),
      ]);
      if (!user) {
        throw new NotFoundException('Doctor not found');
      }

      if (!clinic) {
        throw new NotFoundException('Clinic not found');
      }

      if (!userClinic) {
        throw new NotFoundException('Clinic linked to user not found');
      }

      return userClinic.role;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      await this.errorLogService.logError(
        `Error in finding user role in clinic: ${error?.message}`,
        error?.stack,
        null,
        userId,
        null,
      );
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async findStaffOfClinic(
    queryRunner: QueryRunner,
    userId: string,
    clinicId: number,
    roleCondition: object,
  ): Promise<UserClinic[]> {
    try {
      const roleCheck = await this.findUserRolesInClinic(
        queryRunner,
        userId,
        clinicId,
      );
      // if (!roleCheck?.includes(UserRole.ADMIN)) {
      //   throw new ForbiddenException(
      //     'You arent authorised to view staff of clinic.',
      //   );
      // }
      return await this.userClinicRepository.find({
        where: { clinic: { id: clinicId }, ...roleCondition },
        relations: ['user', 'user.doctor'],
        select: {
          role: true,
          user: {
            uid: true,
            name: true,
            email: true,
            phoneNumber: true,
            publicIdentifier: true,
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
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      await this.errorLogService.logError(
        `Unable to fetch staff of clinic: ${error?.message}`,
        error?.stack,
        null,
        userId,
        `ClinicId: ${clinicId}`,
      );
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
          headerImage: true,
          footerText: true,
          usesOwnLetterPad: true,
          padding: {
            paddingTop: true,
            paddingBottom: true,
            paddingLeft: true,
            paddingRight: true,
          },
        },
      });
      const clinics = userClinics.map(
        ({
          usesOwnLetterPad,
          role,
          headerImage,
          footerText,
          padding,
          clinic,
        }) => ({
          role,
          headerImage,
          footerText,
          padding,
          usesOwnLetterPad,
          ...clinic,
        }),
      );
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

  async addRoleToAdmin(
    queryRunner: QueryRunner,
    adminId: string,
    addRoleToAdminDto: AddRoleToAdminDto,
  ): Promise<any> {
    const { role, clinicId, staffData, address, metaData } = addRoleToAdminDto;
    try {
      const [admin, clinic, doctor, existingRelationship] = await Promise.all([
        queryRunner.manager.findOne(User, { where: { uid: adminId } }),
        queryRunner.manager.findOne(Clinic, { where: { id: clinicId } }),
        queryRunner.manager.findOne(Doctor, {
          where: [
            { user: { uid: adminId }, licenseNumber: staffData.licenseNumber },
          ],
        }),
        queryRunner.manager.findOne(UserClinic, {
          where: { user: { uid: adminId }, clinic: { id: clinicId } },
        }),
      ]);

      if (!admin || !clinic || !existingRelationship) {
        throw new NotFoundException('Credentials Not Found');
      }
      if (doctor) {
        throw new ConflictException('Doctor with credentials already exists');
      }

      if (!existingRelationship?.role?.includes(UserRole.ADMIN)) {
        throw new ForbiddenException(
          'You dont have permissions to add role to admin.',
        );
      }

      if (existingRelationship?.role?.length >= 2) {
        throw new ConflictException("Admin can't have more than 2 roles.");
      }

      if (address) {
        admin.address = address;
      }
      existingRelationship?.role?.push(role);

      const [savedMetaData, savedStaff, savedUserClinic, updatedUser] =
        await Promise.all([
          await queryRunner.manager.save(MetaData, metaData),
          await queryRunner.manager.save(Doctor, { ...staffData, user: admin }),
          await queryRunner.manager.save(UserClinic, existingRelationship),
          await queryRunner.manager.save(User, admin),
        ]);

      const formattedData = {
        role: savedUserClinic.role,
        user: {
          uid: updatedUser?.uid,
          name: updatedUser.name,
          email: updatedUser.email,
          phoneNumber: updatedUser.phoneNumber,
          address: updatedUser.address,
          doctor: {
            id: savedStaff?.id,
            qualification: savedStaff?.qualification,
            fee: savedStaff?.fee,
            licenseNumber: savedStaff?.licenseNumber,
            specialization: savedStaff?.specialization,
          },
        },
      };
      return formattedData;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      await this.errorLogService.logError(
        `Unable to add role to admin in clinic ${clinicId}: ${error.message}`,
        error.stack,
        null,
        adminId,
        null,
      );
    }
  }

  // add check for super admin later
  async changePrescriptionPadType(
    queryRunner: QueryRunner,
    doctorId: string,
    clinicId: number,
    usesOwnLetterPad: boolean,
  ): Promise<any> {
    try {
      const [doctor, clinic, doctorClinic] = await Promise.all([
        queryRunner.manager.findOne(Doctor, {
          where: { user: { uid: doctorId } },
        }),
        queryRunner.manager.findOne(Clinic, {
          where: { id: clinicId },
        }),
        queryRunner.manager.findOne(UserClinic, {
          where: { user: { uid: doctorId }, clinic: { id: clinicId } },
        }),
      ]);
      if (!doctor || !clinic || !doctorClinic) {
        throw new NotFoundException('Doctor not found');
      }

      doctorClinic.usesOwnLetterPad = usesOwnLetterPad;
      await queryRunner.manager.save(doctorClinic);
      return { msg: 'Doctor-Clinic Updated', doctor };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Something went wrong. Unable to update doctor details.',
      );
    }
  }

  // add check for super admin later
  async updatePrescriptionPadding(
    queryRunner: QueryRunner,
    doctorId: string,
    clinicId: number,
    padding: {
      paddingTop?: number | null;
      paddingLeft?: number | null;
      paddingBottom?: number | null;
      paddingRight?: number | null;
    },
  ): Promise<any> {
    const updatedPadding = {
      paddingTop: padding.paddingTop ?? 0,
      paddingLeft: padding.paddingLeft ?? 40,
      paddingBottom: padding.paddingBottom ?? 0,
      paddingRight: padding.paddingRight ?? 40,
    };
    try {
      const [doctor, clinic, doctorClinic] = await Promise.all([
        queryRunner.manager.findOne(Doctor, {
          where: { user: { uid: doctorId } },
        }),
        queryRunner.manager.findOne(Clinic, {
          where: { id: clinicId },
        }),
        queryRunner.manager.findOne(UserClinic, {
          where: { user: { uid: doctorId }, clinic: { id: clinicId } },
        }),
      ]);
      if (!doctor || !clinic || !doctorClinic) {
        throw new NotFoundException('Doctor not found');
      }
      doctorClinic.padding = updatedPadding;
      await queryRunner.manager.save(doctorClinic);
      return { msg: 'Doctor-Clinic Updated', doctor };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Something went wrong. Unable to update doctor details.',
      );
    }
  }
}
