import { Global, Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { FirebaseController } from './firebase.controller';
import { ErrorLogModule } from 'src/errorlog/error-log.module';

@Global()
@Module({
  imports: [ErrorLogModule],
  controllers: [FirebaseController],
  providers: [FirebaseService], // Provide the FirebaseService
  exports: [FirebaseService], // Export the FirebaseService for use in other modules
})
export class FirebaseModule {}
