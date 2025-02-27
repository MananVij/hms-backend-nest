import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entity/user.enitiy';
import * as bcrypt from 'bcrypt';
import { MetaData } from 'src/metadata/entity/metadata.entity';
import { UserClinicService } from 'src/user_clinic/user_clinic.service';
import { ErrorLogService } from 'src/errorlog/error-log.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly userClinicService: UserClinicService,
    private readonly errorLogService: ErrorLogService,
  ) {}

  async createUser(
    createUserDto: CreateUserDto,
    queryRunner: QueryRunner,
  ): Promise<User> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: [
          { email: createUserDto.email },
          { phoneNumber: createUserDto.phoneNumber },
        ],
      });
      if (existingUser) {
        throw new ConflictException('Credentials already exists');
      }
      const hashedPassword = await this.hashPassword(createUserDto.password);
      const user = queryRunner.manager.create(User, {
        name: createUserDto.name,
        phoneNumber: createUserDto.phoneNumber,
        address: createUserDto.address,
        email: createUserDto.email,
        is_verified: createUserDto.is_verified || false,
        password: hashedPassword,
      });
      return await queryRunner.manager.save(user);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      await this.errorLogService.logError(
        `Unable to create user: ${error.message}`,
        error.stack,
        null,
      );
      throw new InternalServerErrorException(
        'Something went wrong. Please try again later.',
      );
    }
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(); // Generate a salt with 10 rounds
    return await bcrypt.hash(password, salt); // Hash the password
  }

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
        relations: ['doctor'],
      });
      if (user && (await bcrypt.compare(password, user.password))) {
        const { password, doctor, ...result } = user;
        const qualification = user.doctor?.qualification;
        const clinicIds = await this.userClinicService.findClinicsOfUser(
          user.uid,
        );
        const defaultClinicId = clinicIds[0]?.id;
        const role = clinicIds[0]?.role;
        const usesOwnLetterPad = clinicIds[0]?.usesOwnLetterPad;
        const headerImage = usesOwnLetterPad ? null : clinicIds[0]?.headerImage;
        const footerText = usesOwnLetterPad ? null : clinicIds[0]?.footerText;
        const padding = usesOwnLetterPad ? clinicIds[0]?.padding : null;
        return {
          qualification,
          defaultClinicId,
          role,
          headerImage,
          footerText,
          padding,
          ...result,
        };
      }
      return null;
    } catch (error) {
      await this.errorLogService.logError(
        `Unable to validate user ${error?.mesage}`,
        error?.stack,
        null,
        `Email: ${email}`,
        null,
      );
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async updateMetaData(
    userId: string,
    metaData: MetaData,
    queryRunner: QueryRunner,
  ): Promise<User> {
    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { uid: userId },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      user.metaData = metaData;
      return queryRunner.manager.save(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      await this.errorLogService?.logError(
        `Unable to update metadata: ${error?.message}`,
        error?.stack,
        null,
        userId,
        null,
      );
      throw new InternalServerErrorException(
        'Something went wrong. Please try again later.',
      );
    }
  }

  async getUserDetails(userId: string): Promise<User> {
    try {
      const isValidUUID =
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
          userId,
        );

      if (!isValidUUID) {
        throw new NotFoundException('User Not Found');
      }
      const user = await this.userRepository.findOne({
        where: { uid: userId },
        relations: ['metaData'],
        select: {
          uid: true,
          name: true,
          phoneNumber: true,
          metaData: { dob: true, height: true, sex: true },
        },
      });
      if (!user) {
        throw new NotFoundException('User Not Found');
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      await this.errorLogService.logError(
        `Unable to find User Details: ${error?.message}`,
        error?.stack,
        null,
        userId,
        null,
      );
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async findUserByPhoneNumber(
    userId: string,
    phoneNumber: string,
    patientCondition: object,
  ): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { phoneNumber, ...patientCondition },
        select: {
          uid: true,
          name: true,
        },
      });
      if (!user) {
        throw new NotFoundException('No User Found');
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      await this.errorLogService.logError(
        `Unable to find user by phone number: ${error?.message}`,
        error?.stack,
        null,
        userId,
        null,
      );
      throw new InternalServerErrorException(
        'Unable to find patient. Something went wrong.',
      );
    }
  }

  async findUserByUserId(userId: string): Promise<User> {
    try {
      return await this.userRepository.findOne({
        where: { uid: userId, isPatient: true },
        relations: ['metaData'],
        select: {
          uid: true,
          name: true,
          phoneNumber: true,
          metaData: {
            dob: true,
            sex: true,
            height: true,
          },
        },
      });
    } catch (error) {
      await this.errorLogService.logError(
        `Unable to find user by userId: ${error?.message}`,
        error?.stack,
        null,
        userId,
        null,
      );
    }
    throw new InternalServerErrorException('Unable to find user.');
  }

  async updatePassword(
    queryRunner: QueryRunner,
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<any> {
    try {
      if (!newPassword || newPassword.length < 6) {
        throw new BadRequestException(
          'Password must be at least 6 characters long.',
        );
      }
      const user = await queryRunner.manager.findOne(User, {
        where: { uid: userId },
      });
      if (!user) {
        throw new NotFoundException('User Not Found');
      }
      const isOldPasswordValid = await bcrypt.compare(
        oldPassword,
        user.password,
      );
      if (!isOldPasswordValid) {
        throw new BadRequestException('Old password is incorrect.');
      }

      const hashedPassword = await this.hashPassword(newPassword);
      user.password = hashedPassword;
      await queryRunner.manager.save(user);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      await this.errorLogService.logError(
        error?.message,
        error?.stack,
        null,
        userId,
        null,
      );
      throw new InternalServerErrorException(
        'Unable to update password. Something went wrong.',
      );
    }
  }
}
