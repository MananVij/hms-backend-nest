import {
  HttpException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClinicService } from 'src/clininc/clinic.service';

@Injectable()
export class SubscriptionMiddleware implements NestMiddleware {
  constructor(private readonly clinicService: ClinicService) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const clinicId = req.headers['x-clinic-id'];

    if (!clinicId) {
      throw new UnauthorizedException('Clinic ID is required');
    }
    const clinicIdNumber = Number(clinicId);
    if (isNaN(clinicIdNumber)) {
      throw new UnauthorizedException('Invalid Clinic ID');
    }

    const { isActive, expiryDate } =
      await this.clinicService.checkSubscriptionStatus(clinicIdNumber);

    if (!isActive) {
      throw new HttpException(
        'Subscription is expired. Navigate to dashboard page to activate subscription.',
        402,
      );
    }
    req.query['clinicId'] = clinicId.toString();
    req['subscription'] = { expiryDate };
    next();
  }
}
