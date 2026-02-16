import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Custom exception with error code for better tracking
 */
export class AppException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    statusCode: HttpStatus,
    public readonly details?: any,
  ) {
    super(
      {
        statusCode,
        message,
        code,
        details,
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
  }
}

/**
 * Helper functions to create typed exceptions
 */
export class BusinessException {
  static emailExists(email: string) {
    return new AppException(
      'AUTH_EMAIL_EXISTS',
      'Email already exists',
      HttpStatus.CONFLICT,
      { email },
    );
  }

  static invalidCredentials() {
    return new AppException(
      'AUTH_INVALID_CREDENTIALS',
      'Invalid credentials',
      HttpStatus.UNAUTHORIZED,
    );
  }

  static fileNotFound(fileId: string) {
    return new AppException(
      'FILE_NOT_FOUND',
      'File not found',
      HttpStatus.NOT_FOUND,
      { fileId },
    );
  }

  static fileNotOwner(fileId: string, userId: string) {
    return new AppException(
      'FILE_NOT_OWNER',
      'You can only delete your own files',
      HttpStatus.FORBIDDEN,
      { fileId, userId },
    );
  }

  static fileUploadFailed(reason: string) {
    return new AppException(
      'FILE_UPLOAD_FAILED',
      'File upload failed',
      HttpStatus.INTERNAL_SERVER_ERROR,
      { reason },
    );
  }

  static fileDeleteFailed(reason: string) {
    return new AppException(
      'FILE_DELETE_FAILED',
      'File deletion failed',
      HttpStatus.INTERNAL_SERVER_ERROR,
      { reason },
    );
  }

  static userNotFound(userId: string) {
    return new AppException(
      'USER_NOT_FOUND',
      'User not found',
      HttpStatus.NOT_FOUND,
      { userId },
    );
  }
}


