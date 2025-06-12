import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { customAlphabet } from 'nanoid';
import { InternalServerErrorException } from '@nestjs/common';
import { User } from './entity/user.enitiy';

@Injectable()
export class PublicIdentifierService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async generateUniquePublicIdentifier(
    maxRetries: number = 5,
  ): Promise<string> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const identifier = PublicIdentifierService.generateCustomNanoId();
      const existingUser = await this.userRepository.findOne({
        where: { publicIdentifier: identifier },
      });

      if (!existingUser) {
        return identifier;
      }
    }
    throw new InternalServerErrorException(
      'Failed to generate a unique public identifier after maximum retries',
    );
  }

  private static generateCustomNanoId(): string {
    const letters = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 2);
    const digits = customAlphabet('0123456789', 5);
    return `${letters()}${digits()}`;
  }
}
