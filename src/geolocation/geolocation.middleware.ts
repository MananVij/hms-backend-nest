import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import axios from 'axios';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class GeoLocationMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const ip = req.headers['x-forwarded-for'] || req.ip;
    try {
      const response = await axios.get(`${process.env.IP_LOCATION_API}/${ip}`);
      const country = response.data.countryCode;
      if (country !== 'IN') {
        throw new ForbiddenException('Access denied.');
      }

      next();
    } catch (error) {
      throw new ForbiddenException('Access denied. Could not verify IP location.');
    }
  }
}
