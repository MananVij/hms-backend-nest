import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { FirebaseService } from 'src/firebase/firebase.service';

@Injectable()
export class BackupService {
  constructor(private readonly firebaseService: FirebaseService) {
    console.log('In BackupService');
  }

  onModuleInit() {
    console.log('BackupService initialized, cron job should be active now.');
  }

  @Cron('30 15 * * *')
  async handleCron() {
    console.log('Backup cron job is running...', new Date().toISOString());

    const backupFileName = `backup-${new Date().toISOString()}.sql`;
    const backupDirectory = path.join(__dirname, 'backups');
    const backupFilePath = path.join(backupDirectory, backupFileName);

    if (!fs.existsSync(backupDirectory)) {
      fs.mkdirSync(backupDirectory, { recursive: true });
      console.log('Backup directory created:', backupDirectory);
    }

    process.env.PGPASSWORD = process.env.DB_PASSWORD;

    const pgDumpCommand = `pg_dump --host=${process.env.DB_HOST_URL} --port=${process.env.DB_PORT} --username=${process.env.DB_USER_NAME} --no-password --format=c --file=${backupFilePath} --no-owner --no-comments --no-publications --no-subscriptions`;

    exec(pgDumpCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error during backup: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }
      console.log(`Backup completed: ${stdout}`);

      this.firebaseService.uploadBackupToFirebase(backupFilePath);
    });
  }
}
