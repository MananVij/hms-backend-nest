 import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FirebaseService } from './firebase.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { validate } from 'class-validator';

@Controller('media')
export class FirebaseController {
  constructor(private readonly firebaseService: FirebaseService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 2)) // Limit to 2 files
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('uid') uid: string,
    @Body('time') time: string,
  ) {
    // Validate files
    if (!Array.isArray(files) || files.length === 0) {
      throw new BadRequestException('No files received');
    }

    // Create DTO instance
    const uploadFileDto = new UploadFileDto();
    uploadFileDto.uid = uid;
    uploadFileDto.time = time;
    uploadFileDto.files = files;

    // Validate the DTO
    const errors = await validate(uploadFileDto);
    if (errors.length > 0) {
      throw new BadRequestException('Validation failed: ' + 
        errors.map(e => Object.values(e.constraints)).join(', ')
      );
    }

    // Call the service to handle file uploads
    return this.firebaseService.uploadFiles(
      uploadFileDto.uid,
      uploadFileDto.time,
      uploadFileDto.files,
    );
  }
}
