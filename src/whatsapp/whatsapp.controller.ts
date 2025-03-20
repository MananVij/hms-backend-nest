import { Controller, Post, Body } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappTemplate } from './whatsapp-template.enum';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('send-message')
  async sendMessage(
    @Body()
    body: {
      to: string;
      templateName: WhatsappTemplate;
      variables: string[];
      headerText?: string;
      fileLink?: string;
    },
  ) {
    try {
      return this.whatsappService.sendMessage(
        body.to,
        body.templateName,
        body.variables,
        body.headerText,
        body.fileLink,
      );
    } catch (error) {
      throw error;
    }
  }
}
