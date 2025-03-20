import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FirebaseService } from './firebase.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { validate } from 'class-validator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';
import { QueryRunner } from 'typeorm';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class FirebaseController {
  constructor(private readonly firebaseService: FirebaseService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 2)) // Limit to 2 files
  async uploadFiles(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('doctor') doctor: string,
    @Body('patient') patient: string,
    @Body('clinicId') clinic: number,
  ) {
    try {
      if (!Array.isArray(files) || files.length === 0) {
        throw new BadRequestException('No files received');
      }

      const uploadFileDto = new UploadFileDto();
      uploadFileDto.doctor = doctor;
      uploadFileDto.patient = patient;
      uploadFileDto.files = files;

      const errors = await validate(uploadFileDto);
      if (errors.length > 0) {
        throw new BadRequestException(
          'Validation failed: ' +
            errors.map((e) => Object.values(e.constraints)).join(', '),
        );
      }

      return await this.firebaseService.uploadFiles(
        queryRunner,
        uploadFileDto.files,
        uploadFileDto.doctor,
        uploadFileDto.patient,
        clinic,
      );
    } catch (error) {
      throw error;
    }
  }
}
