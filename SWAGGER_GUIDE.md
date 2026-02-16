# Swagger API Documentation Guide

## 📚 Overview

This guide explains how to use Swagger/OpenAPI documentation in the Dropbox App backend.

**Swagger UI URL**: `http://localhost:7000/api`  
**OpenAPI JSON**: `http://localhost:7000/api-json`

---

## 🚀 Quick Start

### 1. Start the Application
```bash
yarn start:dev
```

### 2. Open Swagger UI
Navigate to: `http://localhost:7000/api`

### 3. Authenticate (for Protected Endpoints)
1. Click **"Authorize"** button (top right)
2. Enter your JWT token: `Bearer <your-token>`
3. Click **"Authorize"**
4. Click **"Close"**

---

## 🔐 Authentication Flow

### Step 1: Register a New User
1. Open **Authentication** section
2. Click on **POST /auth/register**
3. Click **"Try it out"**
4. Enter user details:
```json
{
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User"
}
```
5. Click **"Execute"**
6. Copy the `accessToken` from response

### Step 2: Login (Alternative)
1. Click on **POST /auth/login**
2. Click **"Try it out"**
3. Enter credentials:
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```
4. Click **"Execute"**
5. Copy the `accessToken` from response

### Step 3: Authorize Swagger
1. Click **"Authorize"** button (🔓 icon at top)
2. Paste token in **Value** field
3. Click **"Authorize"**
4. The lock icon (🔒) indicates you're authenticated

---

## 📋 API Endpoints Overview

### Public Endpoints (No Auth Required)

#### Health Check
**GET /health** - Check service health
```bash
# Response
{
  "status": "ok",
  "timestamp": "2024-02-16T12:34:56.789Z",
  "uptime": 1234.56
}
```

#### Authentication
**POST /auth/register** - Register new user
```bash
# Request
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

# Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-02-16T12:34:56.789Z"
  }
}
```

**POST /auth/login** - Login user
```bash
# Request
{
  "email": "user@example.com",
  "password": "password123"
}

# Response (same as register)
```

### Protected Endpoints (Auth Required 🔒)

#### User Management
**GET /users/me** - Get current user info
```bash
# Headers required: Authorization: Bearer <token>

# Response
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2024-02-16T12:34:56.789Z"
}
```

#### File Management
**POST /files/upload** - Upload a file
```bash
# Headers required: Authorization: Bearer <token>
# Content-Type: multipart/form-data

# Form Data:
# - file: [select file]

# Response
{
  "message": "File uploaded successfully",
  "file": {
    "id": "uuid",
    "name": "document.pdf",
    "size": 1024000,
    "mimeType": "application/pdf",
    "path": "uploads/file-123456789.pdf",
    "userId": "user-uuid",
    "createdAt": "2024-02-16T12:34:56.789Z"
  }
}
```

**GET /files** - List user's files
```bash
# Headers required: Authorization: Bearer <token>

# Response
[
  {
    "id": "uuid",
    "name": "document.pdf",
    "size": 1024000,
    "mimeType": "application/pdf",
    "path": "uploads/file-123456789.pdf",
    "userId": "user-uuid",
    "createdAt": "2024-02-16T12:34:56.789Z"
  }
]
```

**DELETE /files/:id** - Delete a file
```bash
# Headers required: Authorization: Bearer <token>

# Response: 204 No Content
```

---

## 🎯 Using Swagger UI Features

### Try It Out
1. Click on any endpoint to expand
2. Click **"Try it out"** button
3. Fill in required parameters
4. Click **"Execute"**
5. View response below

### File Upload in Swagger
1. Click on **POST /files/upload**
2. Click **"Try it out"**
3. Click **"Choose File"** button
4. Select file from your computer
5. Click **"Execute"**
6. View uploaded file details in response

### Response Codes
- **200** - Success (GET, POST login)
- **201** - Created (POST register, upload)
- **204** - No Content (DELETE)
- **400** - Bad Request (validation error)
- **401** - Unauthorized (missing/invalid token)
- **403** - Forbidden (not file owner)
- **404** - Not Found (resource not found)
- **409** - Conflict (email already exists)
- **500** - Internal Server Error

### Response Schema
Each endpoint shows expected response schema. Click on **"Schema"** tab to see structure.

---

## 🔧 Advanced Features

### Download OpenAPI Spec
```bash
# JSON format
curl http://localhost:7000/api-json > openapi.json

# Or download via browser
http://localhost:7000/api-json
```

### Import to Postman
1. Download OpenAPI spec from `/api-json`
2. Open Postman
3. Click **Import** → **File** → Select downloaded JSON
4. Set up environment variable for `baseUrl` and `token`

### Use with Code Generators
```bash
# Generate TypeScript client
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:7000/api-json \
  -g typescript-axios \
  -o ./generated-client
```

---

## 📝 Configuration

### Environment Variables
```env
# Swagger Configuration
SWAGGER_TITLE="Dropbox App API"
SWAGGER_DESCRIPTION="API documentation for Dropbox App"
SWAGGER_VERSION="1.0"
SWAGGER_PATH="api"
```

### Change Swagger Path
Update `.env`:
```env
SWAGGER_PATH="docs"  # Access at /docs instead of /api
```

---

## 🎨 Swagger UI Features

### Persistent Authorization
Swagger remembers your token even after page refresh (stored in browser).

### Dark/Light Theme
Swagger UI automatically adapts to your browser's theme preference.

### API Grouping
Endpoints are grouped by tags:
- **Health** - System health
- **Authentication** - Auth endpoints
- **Users** - User management
- **Files** - File operations

### Search
Use the search bar at top to filter endpoints.

---

## 🧪 Testing Workflow Example

### Complete Testing Flow
```bash
# 1. Check health
GET /health

# 2. Register user
POST /auth/register
{
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User"
}
# Copy accessToken from response

# 3. Authorize Swagger
Click "Authorize" → Paste token → Authorize

# 4. Get current user
GET /users/me
# Should return your user info

# 5. Upload file
POST /files/upload
# Select a file → Execute
# Copy file id from response

# 6. List files
GET /files
# Should show your uploaded file

# 7. Delete file
DELETE /files/{id}
# Paste file id → Execute
# Should return 204 No Content

# 8. Verify deletion
GET /files
# File should be gone
```

---

## 🔍 Troubleshooting

### 401 Unauthorized Error
**Problem**: Getting 401 on protected endpoints

**Solution**:
1. Make sure you've registered/logged in
2. Copy the `accessToken` from response
3. Click "Authorize" button
4. Paste token (no need to add "Bearer" prefix)
5. Click "Authorize"

### Token Expired
**Problem**: Token expired after 7 days

**Solution**:
1. Login again: **POST /auth/login**
2. Get new token
3. Re-authorize Swagger with new token

### CORS Error
**Problem**: CORS error when testing from different domain

**Solution**: CORS is enabled by default. Make sure you're not blocking cookies/storage in browser.

### File Upload Failed
**Problem**: File upload returns 400 error

**Solution**:
1. Check file size (max 100MB by default)
2. Check file type is allowed
3. Make sure you're authorized
4. Check `uploads/` directory is writable

### Can't See Swagger UI
**Problem**: `/api` returns 404

**Solution**:
1. Make sure app is running: `yarn start:dev`
2. Check port in `.env` (default 7000)
3. Visit correct URL: `http://localhost:7000/api`

---

## 📚 Additional Resources

### Swagger Decorators Used
```typescript
// In controllers
@ApiTags('Feature')              // Group endpoints
@ApiOperation({ summary: '...' }) // Endpoint description
@ApiResponse({ status, type })    // Response documentation
@ApiBearerAuth()                  // Requires JWT token
@ApiConsumes('multipart/form-data') // File upload
@ApiBody({ schema })              // Request body schema
```

### DTO Decorators
```typescript
// In DTOs
@ApiProperty({
  description: 'Field description',
  example: 'example value',
  required: true
})
```

---

## 🎯 Best Practices

1. **Always Authorize First** - For protected endpoints, authorize before testing
2. **Check Response Codes** - Understand what each code means
3. **Read Error Messages** - Error responses include helpful details
4. **Use Schemas** - Check expected request/response format
5. **Test in Order** - Register → Login → Authorize → Test protected endpoints
6. **Clean Up** - Delete test files after testing

---

## 📞 Quick Links

- **Swagger UI**: http://localhost:7000/api
- **OpenAPI JSON**: http://localhost:7000/api-json
- **Health Check**: http://localhost:7000/health

---

*For more details, see [README.md](./README.md) and [BEST_PRACTICES_SUMMARY.md](./BEST_PRACTICES_SUMMARY.md)*


