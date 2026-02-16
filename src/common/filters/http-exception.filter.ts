import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';
import { AppException } from '../exceptions';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let code: string | undefined;
    let details: Record<string, any> | undefined;

    // Handle AppException (our custom business exceptions)
    if (exception instanceof AppException) {
      status = exception.getStatus();
      message = exception.message;
      code = exception.code;
      details = exception.details;
    }
    // Handle standard HttpException
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || message;
        code = responseObj.code;
        details = responseObj.details;
      }
    }
    // Handle generic Error
    else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log the error
    // Only log stack trace for 5xx errors (server errors), not for 4xx (client errors)
    const shouldLogStack = status >= 500;
    
    if (status >= 500) {
      // Server errors - log with full stack trace
      this.logger.error(
        `HTTP ${status} - ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : undefined,
        {
          context: 'HttpExceptionFilter',
          statusCode: status,
          path: request.url,
          method: request.method,
          message,
          code,
        },
      );
    } else if (status >= 400) {
      // Client errors - log as warning without stack trace
      this.logger.warn(
        `HTTP ${status} - ${request.method} ${request.url}`,
        {
          context: 'HttpExceptionFilter',
          statusCode: status,
          path: request.url,
          method: request.method,
          message,
          code,
        },
      );
    } else {
      // Other status codes - log as info
      this.logger.log(
        `HTTP ${status} - ${request.method} ${request.url}`,
        {
          context: 'HttpExceptionFilter',
          statusCode: status,
          path: request.url,
          method: request.method,
          message,
          code,
        },
      );
    }

    // Send RESTful standardized error response
    const errorResponse = {
      success: false,
      statusCode: status,
      message,
      ...(code && { code }),
      ...(details && { details }),
    };

    response.status(status).json(errorResponse);
  }
}



