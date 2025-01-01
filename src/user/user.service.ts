import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryRunner, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserRole } from './entity/user.enitiy';
import * as bcrypt from 'bcrypt';
import { MetaData } from 'src/metadata/entity/metadata.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
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
      user.role = createUserDto.role;
      user.password = await this.hashPassword(createUserDto.password);
      return await userRepo.save(user);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
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
      relations: [
        'doctor',
        'doctor.doctorClinics',
        'doctor.doctorClinics.clinic',
        'clinics',
      ],
    });
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, doctor, ...result } = user;
      const qualification = user.doctor?.qualification;
      var clinicIds = [];
      if (user.role === UserRole.ADMIN) {
        clinicIds = user.clinics.map((clinic) => clinic.id);
      } else if (user.role === UserRole.DOCTOR) {
        clinicIds = user.doctor.doctorClinics.map(
          (clinics) => clinics.clinic.id,
        );
      }
      return { qualification, clinicIds, ...result };
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

  async findOne(id: string): Promise<User> {
    const isValidUUID =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        id,
      );

    if (!isValidUUID) {
      throw new NotFoundException('User Not Found');
    }
    const user = await this.userRepository.findOne({
      where: { uid: id },
      select: { uid: true },
    });
    if (!user) {
      throw new NotFoundException('User Not Found');
    }
    return user;
  }

  async findPatientByPhoneNumber(phoneNumber: string): Promise<User> {
    const patient = await this.userRepository.findOne({
      where: { phoneNumber, role: UserRole.PATIENT },
      select: {
        name: true,
        uid: true,
      },
    });
    if (!patient) {
      throw new NotFoundException('No Patient Found');
    }
    return patient;
  }

  async findStaffByPhoneNumber(phoneNumber: string): Promise<User> {
    const staff = await this.userRepository.findOne({
      where: { phoneNumber, role: In([UserRole.DOCTOR, UserRole.NURSE]) },
      select: {
        name: true,
        uid: true,
      },
    });
    if (!staff) {
      throw new NotFoundException('No User Found');
    }
    return staff;
  }
}
