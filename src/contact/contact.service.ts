import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './entity/contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { User } from '../user/entity/user.enitiy';
import { ErrorLogService } from 'src/errorlog/error-log.service';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private readonly errorLogRepository: ErrorLogService,
  ) {}

  // Create a new contact
  async create(createContactDto: CreateContactDto): Promise<Contact> {
    const { phone_number, pincode, line1, line2, country_code, uid } =
      createContactDto;
    try {
      // Find the user by uid to link with contact
      const user = await this.userRepository.findOne({ where: { uid: uid } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const contact = this.contactRepository.create({
        phone_number,
        pincode,
        line1,
        line2,
        country_code,
        user,
      });

      const savedContact = await this.contactRepository.save(contact);
      if (!user.contacts) {
        user.contacts = [];
      }
      user.contacts.push(savedContact);
      user.contact = savedContact;
      await this.userRepository.save(user);
      await this.userRepository.save(user);
      return savedContact;
    } catch (error) {
      await this.errorLogRepository.logError(
        `Error in creating contact: ${error.message}`,
        error.stack,
        null,
        null,
        null,
      );
    }
  }

  // Update an existing contact
  async update(
    id: number,
    updateContactDto: UpdateContactDto,
  ): Promise<Contact> {
    try {
      const contact = await this.contactRepository.findOne({
        where: { id: id },
      });
      if (!contact) {
        return null;
      }
      Object.assign(contact, updateContactDto);
      return this.contactRepository.save(contact);
    } catch (error) {
      await this.errorLogRepository.logError(
        `Error in updating contact: ${error.message}`,
        error.stack,
        null,
        null,
        null,
      );
    }
  }

  // Retrieve all contacts
  async findAll(): Promise<Contact[]> {
    return this.contactRepository.find({ relations: ['user'] }); // Include related user data
  }

  // Retrieve a contact by ID
  async findOne(id: string): Promise<Contact> {
    try {
      const contact = await this.contactRepository.findOne({
        where: { user: { uid: id } },
      });
      if (!contact) {
        return null;
      }
      return contact;
    } catch (error) {
      await this.errorLogRepository.logError(
        `Error in finding contact: ${error.message}`,
        error.stack,
        null,
        null,
        null,
      );
      throw new Error('Something Went Wrong!');
    }
  }

  // Delete a contact by ID
  async remove(id: string): Promise<void> {
  const result = await this.contactRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Contact not found');
    }
  }
}
