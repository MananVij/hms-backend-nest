import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { Clinic } from './entity/clininc.entity';
import { CreateClinicDto } from './dto/add-clinic.dto';
import { User } from 'src/user/entity/user.enitiy';
import { UserClinicService } from 'src/user_clinic/user_clinic.service';
import { UserRole } from 'src/user_clinic/entity/user_clinic.entity';
import { ErrorLogService } from 'src/errorlog/error-log.service';

@Injectable()
export class ClinicService {
  constructor(
    @InjectRepository(Clinic)
    private readonly clinicRepository: Repository<Clinic>,
    private readonly userClinicService: UserClinicService,
    private readonly errorLogService: ErrorLogService,
  ) {}

  async create(
    adminId: string,
    createClinicDto: CreateClinicDto,
    queryRunner: QueryRunner,
  ): Promise<any> {
    try {
      const admin = await queryRunner.manager.findOne(User, {
        where: { uid: adminId },
        select: {
          uid: true,
        },
      });
      if (!admin) {
        throw new NotFoundException('Admin not found');
      }

      const clinic = queryRunner.manager.create(Clinic, {
        ...createClinicDto,
        createdBy: admin,
        admin,
      });
      const savedClinic = await queryRunner.manager.save(clinic);
      await this.userClinicService.createUserClinic(queryRunner, {
        userId: adminId,
        clinicId: clinic.id,
        role: UserRole.ADMIN,
      });
      admin.hasOnboardedClinic = true;
      await queryRunner.manager.save(admin);

      return { ...savedClinic, role: UserRole.ADMIN };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      await this.errorLogService.logError(
        `Error in creating clinic: ${error.message}`,
        error.stack,
        null,
        adminId,
        null,
      );
      throw new InternalServerErrorException('Something Went Wrong.');
    }
  }

  async findOne(id: number): Promise<Clinic> {
    try {
      const clinic = await this.clinicRepository.findOne({
        where: { id },
        select: {
          id: true,
          name: true,
          line1: true,
          line2: true,
          pincode: true,
          contactNumber: true,
        },
      });
      if (!clinic) {
        return null;
      }
      return clinic;
    } catch (error) {
      await this.errorLogService.logError(
        error.message,
        error.stack,
        null,
        null,
        null,
      );
      throw new InternalServerErrorException(
        'Something Went Wrong. Unable to fetch clinic details at moment.',
      );
    }
  }
}
