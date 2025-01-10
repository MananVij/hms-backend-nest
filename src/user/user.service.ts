import {
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
    const userRepo = queryRunner.manager.getRepository(User);
    try {
      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
      const user: User = new User();
      user.name = createUserDto.name;
      user.phoneNumber = createUserDto.phoneNumber;
      user.address = createUserDto.address;
      user.email = createUserDto.email;
      user.is_verified = createUserDto.is_verified || false;
      user.password = await this.hashPassword(createUserDto.password);
      return await userRepo.save(user);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      await this.errorLogService.logError(
        `Unable to create user: ${error.message}`,
        error.stacks,
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
      return { qualification, defaultClinicId, role, ...result };
    }
    return null;
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
      throw new InternalServerErrorException(
        'Something went wrong. Please try again later.',
      );
    }
  }

  async getUserDetails(userId: string): Promise<User> {
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
  }
  async findUserByPhoneNumber(
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
      throw new InternalServerErrorException(
        'Unable to find patient. Something went wrong.',
      );
    }
  }

  async findUserByUserId(userId: string): Promise<User> {
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
  }
}
