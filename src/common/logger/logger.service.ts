import { Injectable, LoggerService as NestLoggerService, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export enum LogContext {
  APPLICATION = 'Application',
  AUTH = 'Auth',
  USER = 'User',
  FILES = 'Files',
  DATABASE = 'Database',
  HTTP = 'HTTP',
}

interface LogMetadata {
  context?: LogContext | string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly isProduction: boolean;
  private readonly logLevels: LogLevel[];

  constructor(private readonly configService: ConfigService) {
    this.isProduction = this.configService.get('NODE_ENV') === 'production';
    this.logLevels = this.getLogLevels();
  }

  private getLogLevels(): LogLevel[] {
    if (this.isProduction) {
      return ['error', 'warn', 'log'];
    }
    return ['error', 'warn', 'log', 'debug', 'verbose'];
  }

  private shouldLog(level: LogLevel): boolean {
    return this.logLevels.includes(level);
  }

  private formatMessage(message: string, metadata?: LogMetadata): string {
    const timestamp = new Date().toISOString();
    const context = metadata?.context || 'Application';
    const metaString = metadata ? ` | ${JSON.stringify(metadata)}` : '';
    return `[${timestamp}] [${context}] ${message}${metaString}`;
  }

  log(message: string, metadata?: LogMetadata) {
    if (this.shouldLog('log')) {
      console.log(this.formatMessage(message, metadata));
    }
  }

  error(message: string, trace?: string, metadata?: LogMetadata) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage(message, metadata));
      if (trace) {
        console.error(trace);
      }
      // In production, you can send to external service (Slack, Sentry, etc.)
      if (this.isProduction) {
        this.sendToExternalService('error', message, metadata, trace);
      }
    }
  }

  warn(message: string, metadata?: LogMetadata) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage(message, metadata));
      if (this.isProduction) {
        this.sendToExternalService('warn', message, metadata);
      }
    }
  }

  debug(message: string, metadata?: LogMetadata) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage(message, metadata));
    }
  }

  verbose(message: string, metadata?: LogMetadata) {
    if (this.shouldLog('verbose')) {
      console.log(`[VERBOSE] ${this.formatMessage(message, metadata)}`);
    }
  }

  private async sendToExternalService(
    level: string,
    message: string,
    metadata?: LogMetadata,
    trace?: string,
  ) {
    // TODO: Implement external logging service integration
    // Examples:
    // - Slack webhook for critical errors
    // - Sentry for error tracking
    // - CloudWatch/Datadog for metrics
    
    // For now, just log that we would send it
    if (level === 'error') {
      console.log('[External Service] Would send error notification:', {
        level,
        message,
        metadata,
        trace,
      });
    }
  }

  // Helper methods for specific contexts
  logAuth(message: string, userId?: string, metadata?: any) {
    this.log(message, { ...metadata, context: LogContext.AUTH, userId });
  }

  logDatabase(message: string, metadata?: any) {
    this.log(message, { ...metadata, context: LogContext.DATABASE });
  }

  logHttp(message: string, metadata?: any) {
    this.log(message, { ...metadata, context: LogContext.HTTP });
  }

  errorAuth(message: string, trace?: string, userId?: string, metadata?: any) {
    this.error(message, trace, { ...metadata, context: LogContext.AUTH, userId });
  }

  errorDatabase(message: string, trace?: string, metadata?: any) {
    this.error(message, trace, { ...metadata, context: LogContext.DATABASE });
  }
}


