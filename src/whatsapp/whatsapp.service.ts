import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
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
  ) {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;

      const headerComponent =
        variables && variables.length > 0
          ? {
              type: 'header',
              parameters: [{ type: 'text', text: variables[0] }],
            }
          : null;
      const bodyComponent =
        variables && variables.length > 1
          ? {
              type: 'body',
              parameters: variables
                .slice(1)
                .map((v) => ({ type: 'text', text: v })),
            }
          : null;

      const components = [];
      if (headerComponent) components.push(headerComponent);
      if (bodyComponent) components.push(bodyComponent);

      const payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          ...(components.length > 0 && { components }),
        },
      };

      const headers = {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      };

      const response = await firstValueFrom(
        this.httpService.post(url, payload, { headers }),
      );

      return response.data;
    } catch (error) {
      this.errorLogService.logError(
        `Unable to send message on whatsapp: ${error?.message}`,
        error?.stack,
      );
      throw new HttpException(
        error.response?.data || 'Failed to send message',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
