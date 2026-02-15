// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// JWT Constants
export const JWT_CONSTANTS = {
  ALGORITHM: 'HS256',
  DEFAULT_EXPIRES_IN: '7d',
  TOKEN_TYPE: 'Bearer',
} as const;

// File Upload Constants
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  UPLOAD_DIRECTORY: './uploads',
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'application/zip',
  ],
} as const;

// Validation Messages
export const VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Email must be a valid email address',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_MIN_LENGTH: 'Password must be at least 6 characters long',
  PASSWORD_MAX_LENGTH: 'Password must not exceed 50 characters',
  NAME_MAX_LENGTH: 'Name must not exceed 100 characters',
  FILE_REQUIRED: 'File is required',
  INVALID_UUID: 'Invalid UUID format',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  // Auth
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  INVALID_CREDENTIALS: 'Invalid credentials',
  UNAUTHORIZED: 'Unauthorized',
  TOKEN_EXPIRED: 'Token has expired',
  TOKEN_INVALID: 'Invalid token',

  // User
  USER_NOT_FOUND: 'User not found',

  // Files
  FILE_NOT_FOUND: 'File not found',
  FILE_UPLOAD_FAILED: 'File upload failed',
  FILE_DELETE_FAILED: 'File deletion failed',
  FILE_NOT_OWNER: 'You can only delete your own files',
  FILE_TOO_LARGE: 'File size exceeds maximum allowed size',
  FILE_TYPE_NOT_ALLOWED: 'File type is not allowed',

  // General
  INTERNAL_SERVER_ERROR: 'Internal server error',
  BAD_REQUEST: 'Bad request',
  RESOURCE_NOT_FOUND: 'Resource not found',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  USER_REGISTERED: 'User registered successfully',
  USER_LOGGED_IN: 'User logged in successfully',
  FILE_UPLOADED: 'File uploaded successfully',
  FILE_DELETED: 'File deleted successfully',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Swagger
export const SWAGGER_CONFIG = {
  DEFAULT_TITLE: 'Dropbox App API',
  DEFAULT_DESCRIPTION: 'API documentation for Dropbox App',
  DEFAULT_VERSION: '1.0',
  DEFAULT_PATH: 'api',
} as const;

// System
export const SYSTEM = {
  DEFAULT_PORT: 3000,
  BCRYPT_ROUNDS: 10,
} as const;

