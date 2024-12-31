import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CityResponse } from 'maxmind';
import * as requestIp from 'request-ip';
import * as maxmind from 'maxmind';
import * as path from 'path';

@Injectable()
export class IpLocationMiddleware implements NestMiddleware {
  private reader: maxmind.Reader<CityResponse>;

  constructor() {}

  async use(req: any, res: any, next: Function) {
    if (!this.reader) {
      const mmdbPath = path.join(
        __dirname,
        '..',
        'resources',
        'GeoLite2-Country.mmdb',
      );
      this.reader = await maxmind.open(mmdbPath);
    }

    let clientIp = req.headers['x-forwarded-for'] || req.ip;
    if (Array.isArray(clientIp)) {
      clientIp = clientIp[0];
    }
    const location = this.reader.get(clientIp);
    if (location && location.country && location.country.iso_code) {
      const country = location.country.iso_code;
      if (country !== 'IN') {
        throw new HttpException(
          'Access denied: Service not available in your region.',
          HttpStatus.FORBIDDEN,
        );
      }
    } else {
      throw new HttpException(
        'Could not determine location from IP address.',
        HttpStatus.BAD_REQUEST,
      );
    }

    next();
  }
}
