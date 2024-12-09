import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entity/user.enitiy';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
      const user: User = new User();
      user.name = createUserDto.name;
      user.email = createUserDto.email;
      user.is_verified = createUserDto.is_verified;
      user.role = createUserDto.role;
      user.password = await this.hashPassword(createUserDto.password);

      return await this.userRepository.save(user);
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
      relations: ['contact', 'doctor'],
    });
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, contact, doctor, ...result } = user;
      const phone_number = user.contact?.phone_number;
      const qualification = user.doctor?.qualification;
      return { phone_number, qualification, ...result };
    }
    return null;
  }

  findAllUser(): Promise<User[]> {
    return this.userRepository.find();
  }

  findOne(id: string): Promise<User> {
    return this.userRepository.findOne({
      where: { uid: id },
      relations: ['metaData', 'contact'],
    });
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user: User = new User();
    user.name = updateUserDto.name;
    user.is_verified = updateUserDto.is_verified;
    user.password = await this.hashPassword(updateUserDto.password);
    return this.userRepository.save(user);
  }
}
