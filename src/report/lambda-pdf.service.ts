import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Lambda, config } from 'aws-sdk';

@Injectable()
export class LambdaPdfService {
  private lambda: Lambda;

  constructor(private configService: ConfigService) {
    this.validateAwsConfig();
    this.initializeAwsConfig();
  }

  private validateAwsConfig(): void {
    const requiredConfigs = [
      'AWS_REGION',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_LAMBDA_FUNCTION_NAME'
    ];

    const missingConfigs = requiredConfigs.filter(
      config => !this.configService.get(config)
    );

    if (missingConfigs.length > 0) {
      throw new Error(`Missing required AWS configuration: ${missingConfigs.join(', ')}`);
    }
  }

  private initializeAwsConfig(): void {
    try {
      config.update({
        region: this.configService.get('AWS_REGION'),
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      });

      this.lambda = new Lambda();
    } catch (error) {
      throw new Error(`AWS Lambda initialization failed: ${error.message}`);
    }
  }

  async generatePdf(
    html: string,
    headerImage?: string | null,
    footerType?: string | null,
    footerContent?: string | null
  ): Promise<Buffer> {
    // Input validation
    if (!html || typeof html !== 'string' || html.trim().length === 0) {
      throw new Error('HTML content is required and must be a non-empty string');
    }

    try {
      // Prepare payload with null checks
      const payload = {
        html: html.trim(),
        headerImage: headerImage || null,
        footerType: footerType || null,
        footerContent: footerContent || null,
      };

      // Validate payload can be serialized
      let payloadString: string;
      try {
        payloadString = JSON.stringify(payload);
      } catch (serializationError) {
        throw new Error(`Failed to serialize payload: ${serializationError.message}`);
      }

      const functionName = this.configService.get('AWS_LAMBDA_FUNCTION_NAME');
      if (!functionName) {
        throw new Error('AWS_LAMBDA_FUNCTION_NAME is not configured');
      }

      const params = {
        FunctionName: functionName,
        Payload: JSON.stringify({ body: payloadString }),
      };

      const result = await this.lambda.invoke(params).promise();
      
      // Check Lambda invocation status
      if (!result || result.StatusCode !== 200) {
        throw new Error(`Lambda invocation failed with status: ${result?.StatusCode || 'unknown'}`);
      }

      // Validate and parse Lambda response
      if (!result.Payload) {
        throw new Error('Lambda returned empty payload');
      }

      let lambdaResponse: any;
      try {
        lambdaResponse = JSON.parse(result.Payload as string);
      } catch (parseError) {
        throw new Error(`Failed to parse Lambda response: ${parseError.message}`);
      }

      // Handle API Gateway response format
      if (!lambdaResponse || typeof lambdaResponse !== 'object') {
        throw new Error('Invalid Lambda response format');
      }

      if (lambdaResponse.statusCode !== 200) {
        let errorMessage = `Lambda returned status: ${lambdaResponse.statusCode}`;
        
        if (lambdaResponse.body) {
          try {
            const errorBody = JSON.parse(lambdaResponse.body);
            errorMessage = errorBody.error || errorMessage;
          } catch (bodyParseError) {
            // Ignore body parse error, use status code error
          }
        }
        
        throw new Error(errorMessage);
      }

      // Parse the actual response from the body
      if (!lambdaResponse.body) {
        throw new Error('Lambda response missing body');
      }

      let response: any;
      try {
        response = JSON.parse(lambdaResponse.body);
      } catch (bodyParseError) {
        throw new Error(`Failed to parse Lambda response body: ${bodyParseError.message}`);
      }

      // Validate response structure
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response structure from Lambda');
      }

      if (!response.success) {
        throw new Error(response.error || 'PDF generation failed');
      }

      // Validate PDF data
      if (!response.pdfBase64 || typeof response.pdfBase64 !== 'string') {
        throw new Error('Lambda response missing or invalid PDF data');
      }

      // Convert base64 back to Buffer with validation
      try {
        const pdfBuffer = Buffer.from(response.pdfBase64, 'base64');
        
        if (pdfBuffer.length === 0) {
          throw new Error('Generated PDF is empty');
        }

        return pdfBuffer;
      } catch (bufferError) {
        throw new Error(`Failed to convert base64 to buffer: ${bufferError.message}`);
      }

    } catch (error) {
      // Re-throw with a clean error message for report.service.ts to handle
      const cleanMessage = error.message || 'Unknown error occurred during PDF generation';
      throw new Error(`Lambda PDF generation failed: ${cleanMessage}`);
    }
  }
} 