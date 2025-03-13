import {
  Injectable,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { WhatsappTemplate } from './whatsapp-template.enum';
import { ErrorLogService } from 'src/errorlog/error-log.service';

@Injectable()
export class WhatsappService {
  private readonly apiUrl = process.env.WHATSAPP_API_URL;
  private readonly accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  private readonly phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  constructor(
    private readonly httpService: HttpService,
    private readonly errorLogService: ErrorLogService,
  ) {}

  async sendMessage(
    to: string,
    templateName: WhatsappTemplate,
    variables: string[],
    headerText?: string,
    fileLink?: string,
  ) {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      const components: any[] = [];

      if (fileLink) {
        components.push({
          type: 'header',
          parameters: [
            {
              type: 'document',
              document: {
                link: fileLink,
                filename: 'Download Prescription',
              },
            },
          ],
        });
      } else if (headerText) {
        components.push({
          type: 'header',
          parameters: [
            {
              type: 'text',
              text: headerText,
            },
          ],
        });
      }

      if (variables && variables?.length) {
        const bodyComponent = {
          type: 'body',
          parameters: variables.map((value) => ({
            type: 'text',
            text: value,
          })),
        };
        components.push(bodyComponent);
      }

      const languageCode =
        templateName === WhatsappTemplate.APPOINTMENT_REMINDER ? 'en_US' : 'en';
      const payload = {
        messaging_product: 'whatsapp',
        to: `91${to}`,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      };

      const headers = {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      };

      const response = await firstValueFrom(
        this.httpService.post(url, payload, { headers }),
      );
      const msgResponse = response?.data?.messages[0];
      if (msgResponse && msgResponse?.message_status === 'accepted') {
        return `${msgResponse?.id ?? ''}`;
      }
      return null;
    } catch (error) {
      this.errorLogService.logError(
        `Unable to send message on whatsapp: ${error?.message}`,
        error?.stack,
      );
      throw new InternalServerErrorException(
        error.response?.data || 'Failed to send whatsapp message.',
      );
    }
  }
}
