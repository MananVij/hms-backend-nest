import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';

@Injectable()
export class FirebaseService {
  private bucket: admin.storage.Storage;

  constructor() {
    if (!admin.apps.length) {
      const serviceFilePath = path.join(
        process.cwd(),
        'src',
        'serviceAccountKey.json',
      );
      const serviceAccountPath = path.resolve(serviceFilePath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    }

    this.bucket = admin.storage();
  }

  async uploadFiles(
    files: Express.Multer.File[],
    doctor: string,
    patient: string,
  ): Promise<{ pres_url: string; audio_url: string }> {
    const folderPath = `prescription_data/${doctor}/${patient}`;
    const pdfFile = files.find((file) => file.mimetype === 'application/pdf');
    const audioFile = files.find(
      (file) =>
        file.mimetype.startsWith('audio/') || file.mimetype === 'video/mp4',
    );
    if (!pdfFile && !audioFile)
      throw new Error('PDF and audio files are required');

    let audio_url = ""
    let pres_url = ""
    if(audioFile) {
      audio_url = await this.uploadSingleFile(audioFile, `${folderPath}/${audioFile.originalname}`);
    }
    if(pdfFile) {
      pres_url = await this.uploadSingleFile(pdfFile, `${folderPath}/${pdfFile.originalname}`);
    }
    return { pres_url, audio_url};
  }

  async uploadSingleFile(
    file: Express.Multer.File,
    filePath: string,
  ): Promise<string> {
    const fileUpload = this.bucket.bucket().file(filePath);

    return new Promise<string>((resolve, reject) => {
      const stream = fileUpload.createWriteStream({
        metadata: { contentType: file.mimetype },
      });
      stream.on('error', (error) => {
        console.error('Error uploading file:', error.message);
        reject(new Error('Failed to upload file to Firebase Storage'));
      });
      
      stream.on('finish', async () => {
        try {
          await fileUpload.makePublic();
          const publicUrl = `https://storage.googleapis.com/${fileUpload.bucket.name}/${filePath}`;
          resolve(publicUrl);
        } catch (error) {
          console.error('Error making file public:', error.message);
  
          // Generate a signed URL as a fallback
          try {
            const [signedUrl] = await fileUpload.getSignedUrl({
              action: 'read',
              expires: '03-01-2500', // Adjust as needed
            });
            console.log('File uploaded successfully. Signed URL:', signedUrl);
            resolve(signedUrl);
          } catch (signedError) {
            console.error('Error generating signed URL:', signedError.message);
            reject(new Error('Failed to make file public or generate signed URL'));
          }
        }
      });
      stream.end(file.buffer);
    });
  }
}
