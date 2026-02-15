import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    // Log incoming request
    this.logger.logHttp(`Incoming Request: ${method} ${url}`, {
      method,
      url,
      userAgent,
      body: this.sanitizeBody(body),
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const elapsedTime = Date.now() - startTime;
          this.logger.logHttp(`Request Completed: ${method} ${url}`, {
            method,
            url,
            elapsedTime: `${elapsedTime}ms`,
          });
        },
        error: (error) => {
          const elapsedTime = Date.now() - startTime;
          this.logger.error(
            `Request Failed: ${method} ${url}`,
            error.stack,
            {
              method,
              url,
              elapsedTime: `${elapsedTime}ms`,
              error: error.message,
            },
          );
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret'];
    const sanitized = { ...body };

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });

    return sanitized;
  }
}

