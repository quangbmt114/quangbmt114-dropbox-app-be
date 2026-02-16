# RESTful API Response Format

## 📋 Overview

Toàn bộ API endpoints đều follow chuẩn RESTful response format với structure nhất quán.

---

## ✅ Success Response Format

### Structure

```typescript
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data here */ }
}
```

### Examples

#### 1. Register/Login Response

**Endpoint:** `POST /auth/register` hoặc `POST /auth/login`

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2026-02-16T10:30:00.000Z"
    }
  }
}
```

#### 2. Get Current User

**Endpoint:** `GET /users/me`

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2026-02-16T10:30:00.000Z"
  }
}
```

#### 3. Upload File

**Endpoint:** `POST /files/upload`

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": "file-uuid",
    "name": "document.pdf",
    "size": 1024000,
    "mimeType": "application/pdf",
    "path": "uploads/file-1234567890-123456789.pdf",
    "userId": "user-uuid",
    "createdAt": "2026-02-16T10:30:00.000Z"
  }
}
```

#### 4. Get Files List

**Endpoint:** `GET /files`

```json
{
  "success": true,
  "message": "Files retrieved successfully",
  "data": [
    {
      "id": "file-uuid-1",
      "name": "document1.pdf",
      "size": 1024000,
      "mimeType": "application/pdf",
      "path": "uploads/file-1234567890-123456789.pdf",
      "userId": "user-uuid",
      "createdAt": "2026-02-16T10:30:00.000Z"
    },
    {
      "id": "file-uuid-2",
      "name": "image.jpg",
      "size": 512000,
      "mimeType": "image/jpeg",
      "path": "uploads/file-1234567890-987654321.jpg",
      "userId": "user-uuid",
      "createdAt": "2026-02-16T09:15:00.000Z"
    }
  ]
}
```

#### 5. Delete File

**Endpoint:** `DELETE /files/:id`

```json
{
  "success": true,
  "message": "File deleted successfully",
  "data": null
}
```

#### 6. Health Check

**Endpoint:** `GET /health`

```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "ok",
    "timestamp": "2026-02-16T10:30:00.000Z",
    "uptime": 123456.789
  }
}
```

---

## ❌ Error Response Format

### Structure

```typescript
{
  "success": false,
  "statusCode": 400,
  "message": "Error message",
  "code": "ERROR_CODE",        // optional
  "details": { /* details */ } // optional
}
```

### Examples

#### 1. Validation Error (400)

```json
{
  "success": false,
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ]
}
```

#### 2. Unauthorized Error (401)

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid credentials",
  "code": "AUTH_INVALID_CREDENTIALS"
}
```

#### 3. Forbidden Error (403)

```json
{
  "success": false,
  "statusCode": 403,
  "message": "You can only delete your own files",
  "code": "FILE_NOT_OWNER"
}
```

#### 4. Not Found Error (404)

```json
{
  "success": false,
  "statusCode": 404,
  "message": "File not found",
  "code": "FILE_NOT_FOUND"
}
```

#### 5. Conflict Error (409)

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Email already exists",
  "code": "AUTH_EMAIL_EXISTS",
  "details": {
    "email": "user@example.com"
  }
}
```

#### 6. Internal Server Error (500)

```json
{
  "success": false,
  "statusCode": 500,
  "message": "File upload failed",
  "code": "FILE_UPLOAD_FAILED"
}
```

---

## 🔑 Error Codes Reference

### Authentication Errors

| Code | Status | Message |
|------|--------|---------|
| `AUTH_EMAIL_EXISTS` | 409 | Email already exists |
| `AUTH_INVALID_CREDENTIALS` | 401 | Invalid credentials |

### File Errors

| Code | Status | Message |
|------|--------|---------|
| `FILE_NOT_FOUND` | 404 | File not found |
| `FILE_NOT_OWNER` | 403 | You can only delete your own files |
| `FILE_UPLOAD_FAILED` | 500 | File upload failed |
| `FILE_DELETE_FAILED` | 500 | File deletion failed |

---

## 🎯 Implementation Details

### BaseResponseDto

```typescript
export class BaseResponseDto<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;

  @ApiProperty({ description: 'Response data' })
  data: T;

  constructor(data: T, message: string = 'Success') {
    this.success = true;
    this.message = message;
    this.data = data;
  }
}
```

### Usage in Controllers

```typescript
@Get('me')
getCurrentUser(@CurrentUser() user: any): BaseResponseDto<UserResponseDto> {
  const userData: UserResponseDto = { /* ... */ };
  return new BaseResponseDto(userData, 'User retrieved successfully');
}
```

### Error Response (Auto-handled by HttpExceptionFilter)

```typescript
// In service
throw BusinessException.invalidCredentials();

// HttpExceptionFilter transforms it to:
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid credentials",
  "code": "AUTH_INVALID_CREDENTIALS"
}
```

---

## 📝 Best Practices

1. ✅ **Always use `BaseResponseDto`** cho success responses
2. ✅ **Always throw proper exceptions** (BusinessException) trong service layer
3. ✅ **Provide meaningful messages** trong response
4. ✅ **Include error codes** để frontend dễ handle
5. ✅ **Keep response structure consistent** across all endpoints
6. ✅ **Don't expose sensitive data** (passwords, internal paths, etc.)

---

## 🔍 Testing Examples

### Using cURL

#### Success Request
```bash
curl -X GET http://localhost:7000/health
```

**Response:**
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "ok",
    "timestamp": "2026-02-16T10:30:00.000Z",
    "uptime": 123.456
  }
}
```

#### Error Request
```bash
curl -X POST http://localhost:7000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@email.com","password":"wrong"}'
```

**Response:**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid credentials",
  "code": "AUTH_INVALID_CREDENTIALS"
}
```

---

## 🚀 Benefits

1. **Consistent Structure**: Dễ parse và handle ở frontend
2. **Clear Success/Failure**: Field `success` để check nhanh
3. **Meaningful Messages**: Human-readable messages
4. **Error Codes**: Machine-readable codes để handle logic
5. **Type Safety**: Full TypeScript support với generics
6. **Swagger Integration**: Tự động generate API docs

---

## 📚 Related Files

- `src/common/dto/base-response.dto.ts` - Success response wrapper
- `src/common/dto/error-response.dto.ts` - Error response structure
- `src/common/filters/http-exception.filter.ts` - Global error handler
- `src/common/exceptions/business.exception.ts` - Custom exceptions
- `src/common/constants/index.ts` - Error codes & messages

