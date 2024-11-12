import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';

@Injectable()
export class FirebaseService {
  private bucket: admin.storage.Storage;

  constructor() {
    const serviceFilePAth = path.join(
      process.cwd(),
      'src',
      'serviceAccountKey.json',
    );
    const serviceAccountPath = path.resolve(serviceFilePAth);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
      storageBucket: process.env.STORAGE_BUCKET,
    });
    this.bucket = admin.storage();
  }

  async uploadFiles(
    uid: string,
    time: string,
    files: Express.Multer.File[],
  ): Promise<{ pdfUrl: string; audioUrl: string }> {
    const folderPath = `prescription_data/${uid}/${time}`;
    const pdfFile = files.find((file) => file.mimetype === 'application/pdf');
    const audioFile = files.find(
      (file) =>
        file.mimetype.startsWith('audio/') || file.mimetype === 'video/mp4',
    );

    if (!pdfFile || !audioFile)
      throw new Error('PDF and audio files are required');

    const pdfUrl = await this.uploadSingleFile(pdfFile, folderPath);
    const audioUrl = await this.uploadSingleFile(audioFile, folderPath);

    return { pdfUrl, audioUrl };
  }

  private async uploadSingleFile(
    file: Express.Multer.File,
    folderPath: string,
  ): Promise<string> {
    const fileName = `${Date.now()}_${file.originalname}`;
    const filePath = `${folderPath}/${fileName}`;
    const fileUpload = this.bucket.bucket().file(filePath);

    return new Promise<string>((resolve, reject) => {
      const stream = fileUpload.createWriteStream({
        metadata: { contentType: file.mimetype },
      });
      stream.on('error', reject);
      stream.on('finish', async () => {
        await fileUpload.makePublic();
        resolve(
          `https://storage.googleapis.com/${fileUpload.bucket.name}/${filePath}`,
        );
      });
      stream.end(file.buffer);
    });
  }
}
