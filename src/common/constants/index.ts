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
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB for images and documents
  MAX_VIDEO_SIZE: 500 * 1024 * 1024, // 500MB for videos
  MAX_STORAGE_QUOTA: 10 * 1024 * 1024 * 1024, // 10GB per user
  MAX_FILENAME_LENGTH: 255,
  UPLOAD_DIRECTORY: './uploads',
  ALLOWED_MIME_TYPES: [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Videos
    'video/mp4',
    'video/mpeg',
    'video/quicktime', // .mov
    'video/x-msvideo', // .avi
    'video/x-matroska', // .mkv
    'video/webm',
    'video/x-flv',
    'video/3gpp',
    'video/3gpp2',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    // Archives
    'application/zip',
  ],
  DOCUMENT_MIME_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],
} as const;

// File Select Fields (reusable)
export const FILE_SELECT_FIELDS = {
  id: true,
  name: true,
  size: true,
  mimeType: true,
  path: true,
  userId: true,
  createdAt: true,
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

// Error Codes for better tracking
export const ERROR_CODES = {
  // Auth errors (AUTH_xxx)
  AUTH_EMAIL_EXISTS: 'AUTH_EMAIL_EXISTS',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  
  // User errors (USER_xxx)
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  
  // File errors (FILE_xxx)
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  FILE_DELETE_FAILED: 'FILE_DELETE_FAILED',
  FILE_NOT_OWNER: 'FILE_NOT_OWNER',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_TYPE_NOT_ALLOWED: 'FILE_TYPE_NOT_ALLOWED',
  
  // Validation errors (VALID_xxx)
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  
  // General errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
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

