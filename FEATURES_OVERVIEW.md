# 📋 Dropbox App Backend - Tổng Hợp Tính Năng

> **Production-ready NestJS REST API** với JWT authentication, file management, và enterprise-grade best practices.

---

## 🎯 Tổng Quan Hệ Thống

**Mục đích:** Backend API cho ứng dụng lưu trữ file (giống Dropbox)  
**Đối tượng:** Người dùng cá nhân và team muốn upload, quản lý, chia sẻ files  
**Tech Stack:** NestJS + TypeScript + Prisma + PostgreSQL + JWT

---

## 📦 Các Module Chính

### 1. 🔐 Authentication Module (`/auth`)

**Mục đích:** Xác thực người dùng, quản lý JWT tokens

**Endpoints:**
- `POST /auth/register` - Đăng ký tài khoản mới
- `POST /auth/login` - Đăng nhập, nhận JWT token

**Tính năng:**
- ✅ Hash password với bcrypt
- ✅ JWT token generation & validation
- ✅ Password hashing tự động khi register
- ✅ Email validation & unique constraint

**DTOs:**
- `RegisterDto` - Email, password, name
- `LoginDto` - Email, password
- `AuthResponseDto` - User info + JWT token

**Security:**
- Password: Bcrypt hashing
- JWT: Expire time configurable
- Protected routes: Require valid JWT token

---

### 2. 📁 Files Module (`/files`)

**Mục đích:** Upload, lưu trữ, quản lý files (hình ảnh, video, documents, archives)

#### A. Upload Files (Regular)

**Endpoint:** `POST /files/upload`

**Tính năng:**
- ✅ Upload single file
- ✅ Hỗ trợ: Images, Videos, Documents, Archives
- ✅ Auto-generate unique filename
- ✅ Save to local disk hoặc S3
- ✅ **Auto video thumbnail generation** (dùng FFmpeg)
- ✅ Extract video duration & metadata
- ✅ Lưu thông tin vào database

**Limits:**
- Max file size: 2GB (video), 10MB (image), 50MB (document/archive)
- Configurable trong constants

**Process:**
```
1. Nhận file → Validate size/type
2. Generate unique filename
3. Save to storage (local/S3)
4. [Video only] Generate thumbnail (FFmpeg)
5. Save metadata to database
6. Return file info + URLs
```

#### B. Chunked Upload (Large Files)

**Mục đích:** Upload file lớn chia thành nhiều chunks

**Endpoints:**
- `POST /files/upload/chunk` - Upload từng chunk
- `POST /files/upload/complete` - Ghép chunks thành file hoàn chỉnh
- `GET /files/upload/status/:fileId` - Kiểm tra tiến độ upload
- `DELETE /files/upload/cancel/:fileId` - Hủy chunked upload

**Process:**
```
1. Frontend chia file thành chunks (5MB mỗi chunk)
2. Upload từng chunk → Backend lưu tạm vào /uploads/chunks/{fileId}/
3. Khi đủ chunks → Call /upload/complete
4. Backend ghép chunks → Tạo file hoàn chỉnh
5. [Video] Generate thumbnail
6. Xóa chunks tạm
7. Return file info
```

**Tính năng:**
- ✅ Resume upload (upload lại chunk bị fail)
- ✅ Progress tracking
- ✅ Auto cleanup chunks khi complete/cancel
- ✅ Support file lên đến vài GB

#### C. Upload Recommendation

**Mục đích:** Gợi ý method upload phù hợp (regular hay chunked)

**Endpoints:**
- `GET /files/upload/recommend?fileSize=1000000` - Gợi ý method
- `GET /files/upload/limits` - Lấy limits cho từng file type

**Logic:**
- File < 100MB → Regular upload (đơn giản, nhanh)
- File >= 100MB → Chunked upload (ổn định, resume được)

**Response:**
```json
{
  "recommendedMethod": "chunked",
  "reason": "File lớn hơn 100MB, nên dùng chunked upload",
  "chunkSize": 5242880,
  "estimatedChunks": 20
}
```

#### D. View & Download Files

**Endpoints:**
- `GET /files/view/:id` - **Public** (không cần auth) - Xem file trong browser
- `GET /files/download/:id` - **Protected** - Download file (force attachment)

**View vs Download:**
- **View:** Content-Disposition: `inline` → Browser hiển thị trực tiếp (image, video)
- **Download:** Content-Disposition: `attachment` → Browser download file

**Tính năng:**
- ✅ Public view URLs (share được link)
- ✅ CORS enabled cho view endpoint
- ✅ Streaming (không load hết file vào memory)
- ✅ Cache headers (1 year)
- ✅ Support cả local files & S3 URLs

#### E. File Management

**Endpoints:**
- `GET /files` - Lấy danh sách files của user
  - Filter by type: `?type=video|image|document|archive`
- `GET /files/:id` - Lấy thông tin 1 file
- `DELETE /files/:id` - Xóa file (soft delete)
- `GET /files/stats` - Thống kê storage của user
- `GET /files/storage-info` - Thông tin storage config

**File Stats Response:**
```json
{
  "totalFiles": 25,
  "totalSize": 1073741824,
  "totalSizeFormatted": "1.00 GB",
  "filesByType": {
    "video": { "count": 5, "size": 500000000 },
    "image": { "count": 20, "size": 50000000 }
  }
}
```

#### F. Video Thumbnail Service

**Mục đích:** Tự động generate thumbnail cho video files

**Tính năng:**
- ✅ Generate thumbnail tại giây thứ 1
- ✅ Resolution: 320x180 (medium quality)
- ✅ Format: JPEG
- ✅ Extract metadata: duration, width, height, format
- ✅ Lưu thumbnail cùng folder với video

**Tech:** Dùng `fluent-ffmpeg` wrapper cho FFmpeg

**Process:**
```
Video upload → FFmpeg extract frame at 1s → Save as thumbnail.jpg → Save path to DB
```

**Advanced features (có thể dùng):**
- Generate multiple sizes (small, medium, large)
- Generate thumbnail at specific time
- Extract multiple frames

---

### 3. 👤 User Module (`/users`)

**Mục đích:** Quản lý thông tin user

**Endpoints:**
- `GET /users/me` - Lấy thông tin user hiện tại (từ JWT token)

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2026-03-07T00:00:00.000Z"
}
```

---

### 4. 🏥 Health Module (`/health`)

**Mục đích:** Health check endpoint cho monitoring

**Endpoint:**
- `GET /health` - **Public** - Kiểm tra trạng thái server

**Response:**
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "ok",
    "timestamp": "2026-03-07T00:00:00.000Z",
    "uptime": 123.456
  }
}
```

---

## 🛠️ Infrastructure & Best Practices

### A. Database (Prisma + PostgreSQL)

**Models:**

**User:**
- id, email (unique), password (hashed), name
- files[] - relation to File
- createdAt, updatedAt, deletedAt (soft delete)

**File:**
- id, name, size, mimeType, path
- thumbnailPath (for images/videos)
- duration (for videos, in seconds)
- userId - relation to User
- createdAt, deletedAt (soft delete)

**Features:**
- ✅ Soft delete (không xóa thật, chỉ mark deletedAt)
- ✅ Cascade delete (xóa user → xóa files)
- ✅ Indexes (userId cho performance)

### B. Storage Service (Abstraction)

**Mục đích:** Support cả local storage & S3 (dễ switch)

**Providers:**
- `LocalStorageProvider` - Lưu file vào disk local
- `S3StorageProvider` - Lưu file lên AWS S3

**Interface:**
```typescript
interface IStorageProvider {
  uploadFile(file, key): Promise<string>; // Return URL
  deleteFile(key): Promise<void>;
  getFileUrl(key): string;
}
```

**Config:** Dùng `.env` để chọn provider
```
STORAGE_PROVIDER=local # or s3
AWS_S3_BUCKET=my-bucket
AWS_REGION=us-east-1
```

### C. Logger Service

**Mục đích:** Structured logging cho debugging & monitoring

**Features:**
- ✅ Log levels: log, error, warn, debug
- ✅ Context-aware (biết log từ module nào)
- ✅ Colorized output (dễ đọc)
- ✅ Production-ready (log format chuẩn)

**Usage:**
```typescript
this.logger.log('File uploaded', { fileId, userId });
this.logger.error('Upload failed', error.stack, { fileId });
```

### D. Exception Handling

**Global Exception Filter:**
- Catch tất cả exceptions
- Format response chuẩn (BaseResponseDto)
- Distinguish client errors (4xx) vs server errors (5xx)

**Business Exception:**
- Custom exception cho business logic
- Pre-defined errors: fileNotFound, fileTooLarge, invalidFileType, etc.

**Response format:**
```json
{
  "success": false,
  "message": "File not found",
  "error": {
    "code": "FILE_NOT_FOUND",
    "statusCode": 404
  }
}
```

### E. Constants Management

**Centralized config:**
- File upload limits
- File type validation
- Chunk sizes
- Storage paths

**Location:** `src/common/constants/index.ts`

**Example:**
```typescript
export const FILE_UPLOAD = {
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 2 * 1024 * 1024 * 1024, // 2GB
  UPLOAD_DIRECTORY: './uploads',
  CHUNK_SIZE: 5 * 1024 * 1024, // 5MB
};
```

### F. Utility Helpers

**String Utils:**
- slugify, capitalize, truncate, etc.

**Date Utils:**
- formatDate, parseDate, dateRange, etc.

**File Utils:**
- formatFileSize, getFileExtension, getMimeType, etc.

**Pagination Utils:**
- paginate, getPaginationMeta, etc.

---

## 🔒 Security Features

### Authentication & Authorization

**JWT Strategy:**
- Token in Authorization header: `Bearer <token>`
- Token expires: 7 days (configurable)
- Protected routes: Require valid JWT

**Public Routes:**
- `/health` - Health check
- `/auth/register` - Register
- `/auth/login` - Login
- `/files/view/:id` - View files (public sharing)

**Protected Routes:**
- All other endpoints require JWT token

**Decorator System:**
- `@Public()` - Mark route as public (no auth)
- `@CurrentUser()` - Extract user from JWT token
- `@UseGuards(JwtAuthGuard)` - Protect route

### File Security

**Validation:**
- File size limits
- MIME type validation
- File extension validation
- Virus scanning (có thể thêm)

**Access Control:**
- Users chỉ xem/xóa được files của mình
- Public view: Share được link, nhưng không thể delete

**Storage:**
- Unique filenames (prevent collision)
- Organized by date folders (optional)
- Soft delete (có thể recover)

---

## 📊 Response Format (RESTful Standard)

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "error": {
    "code": "ERROR_CODE",
    "statusCode": 400
  }
}
```

**Pagination Response:**
```json
{
  "success": true,
  "message": "Data retrieved",
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

## 🚀 API Documentation (Swagger)

**Swagger UI:** `http://localhost:7001/api`  
**OpenAPI JSON:** `http://localhost:7001/api-json`

**Features:**
- ✅ Auto-generated từ code (decorators)
- ✅ Interactive testing (Try it out)
- ✅ Authentication support (Bearer token)
- ✅ Request/Response examples
- ✅ DTOs & validation rules

**Export Schema:**
```bash
npm run swagger:export
# Generates: swagger.json, swagger.yaml
```

---

## 🔄 Frontend Integration

### Type Generation (curl Method)

**Backend:** Đã sẵn sàng! Swagger auto-exposed

**Frontend Setup:**
```bash
# 1. Copy setup script
cp scripts/setup-frontend.sh /path/to/frontend/

# 2. Run setup (5 minutes)
cd /path/to/frontend
bash setup-frontend.sh

# 3. Update types (30 seconds)
npm run update:api
```

**Result:** 100% type-safe TypeScript API client

**Usage:**
```typescript
import { filesApi } from './api/client';

// ✅ Type-safe!
const files = await filesApi.filesControllerGetUserFiles();
console.log(files.data.data[0].url);
//                        ^^^ Auto-complete!
```

**Docs:** Xem [SUMMARY_VIETNAMESE.md](SUMMARY_VIETNAMESE.md)

---

## 📁 File Types Supported

### Images
- JPEG, PNG, GIF, WebP, BMP, SVG
- Max size: 10MB
- Auto thumbnail: N/A (images are their own thumbnails)

### Videos
- MP4, AVI, MOV, MKV, WebM, FLV
- Max size: 2GB
- Auto thumbnail: ✅ Generated at 1s
- Metadata: Duration extracted

### Documents
- PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT
- Max size: 50MB

### Archives
- ZIP, RAR, 7Z, TAR, GZ
- Max size: 50MB

---

## 🎯 Use Cases

### 1. Personal File Storage
```
User đăng ký → Upload photos/videos → Xem lại bất cứ lúc nào
```

### 2. Team Collaboration
```
Team upload documents → Share view links → Collaborate
```

### 3. Media Management
```
Upload videos → Auto thumbnails → Easy preview → Download khi cần
```

### 4. Large File Transfer
```
File > 100MB → Chunked upload → Resume nếu fail → Reliable delivery
```

---

## 📊 Storage Statistics

**Per User:**
- Total files count
- Total storage used (bytes + formatted)
- Breakdown by type (video, image, document, archive)
- Each type: count + size

**Example:**
```json
{
  "totalFiles": 25,
  "totalSize": 1073741824,
  "totalSizeFormatted": "1.00 GB",
  "filesByType": {
    "video": { "count": 5, "size": 500000000, "sizeFormatted": "476.84 MB" },
    "image": { "count": 15, "size": 52428800, "sizeFormatted": "50.00 MB" },
    "document": { "count": 5, "size": 10485760, "sizeFormatted": "10.00 MB" }
  }
}
```

---

## 🛠️ Configuration

### Environment Variables

```env
# Server
NODE_ENV=development
PORT=7001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dropbox

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Storage
STORAGE_PROVIDER=local # or s3
UPLOAD_DIRECTORY=./uploads

# AWS S3 (if using S3)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=my-bucket

# Swagger
SWAGGER_TITLE=Dropbox App API
SWAGGER_VERSION=1.0
SWAGGER_PATH=api
```

---

## 📈 Performance Features

### File Streaming
- Không load toàn bộ file vào memory
- Dùng streams → Memory efficient
- Support files lớn

### Caching
- Static files: Cache 1 year (immutable)
- Cache headers: `Cache-Control: public, max-age=31536000`

### Database
- Indexes trên userId (fast queries)
- Soft delete (không cần rebuild foreign keys)

### Chunked Upload
- Upload song song nhiều chunks
- Resume từ chunk fail
- Không bị timeout với file lớn

---

## 🔍 Monitoring & Debugging

### Logging
- Request/Response logging (interceptor)
- Error logging với stack trace
- Structured logs (dễ parse)

### Health Check
- `/health` endpoint
- Monitor uptime, status
- Integrate với monitoring tools (DataDog, New Relic, etc.)

### Error Tracking
- Global exception filter
- Distinguish client vs server errors
- Detailed error messages (dev) vs user-friendly (prod)

---

## 🎨 Architecture Highlights

### Clean Architecture
```
Controllers (HTTP layer)
    ↓
Services (Business logic)
    ↓
Repositories/Prisma (Data layer)
    ↓
Database (PostgreSQL)
```

### Module Structure
```
src/
├── modules/          # Feature modules
│   ├── auth/
│   ├── files/
│   ├── user/
│   └── health/
├── common/           # Shared utilities
│   ├── decorators/
│   ├── guards/
│   ├── filters/
│   ├── interceptors/
│   ├── dto/
│   ├── exceptions/
│   ├── utils/
│   ├── constants/
│   └── storage/
├── prisma/           # Prisma service
├── app.module.ts     # Root module
└── main.ts           # Entry point
```

### Dependency Injection
- NestJS built-in DI container
- Easy testing (mock services)
- Loose coupling

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Setup database
npm run prisma:generate
npm run prisma:migrate

# Start dev server
npm run start:dev
# → http://localhost:7001

# View Swagger docs
# → http://localhost:7001/api

# Export OpenAPI schema
npm run swagger:export

# Open Prisma Studio
npm run prisma:studio

# Build for production
npm run build
npm run start:prod
```

---

## 📦 Dependencies Summary

**Core:**
- NestJS - Framework
- Prisma - ORM
- PostgreSQL - Database
- TypeScript - Language

**Authentication:**
- @nestjs/jwt - JWT tokens
- @nestjs/passport - Auth strategies
- bcrypt - Password hashing

**File Upload:**
- Multer - Multipart form data
- fluent-ffmpeg - Video thumbnails
- @aws-sdk/client-s3 - S3 storage

**API Docs:**
- @nestjs/swagger - OpenAPI/Swagger

**Validation:**
- class-validator - DTO validation
- class-transformer - DTO transformation

---

## ✅ Production Ready Features

- ✅ JWT Authentication & Authorization
- ✅ File upload (regular + chunked)
- ✅ Video thumbnail generation
- ✅ Storage abstraction (local/S3)
- ✅ Soft delete
- ✅ Structured logging
- ✅ Global exception handling
- ✅ Request logging
- ✅ API documentation (Swagger)
- ✅ Type-safe frontend integration
- ✅ Health check endpoint
- ✅ CORS configuration
- ✅ Environment-based config
- ✅ Clean architecture
- ✅ TypeScript strict mode

---

## 🎯 Điểm Mạnh

1. **Đầy đủ tính năng:** Auth, upload, chunking, thumbnails, stats
2. **Dễ mở rộng:** Module structure, dependency injection
3. **Type-safe:** 100% TypeScript, Prisma type-safe
4. **Production-ready:** Logging, error handling, monitoring
5. **Developer-friendly:** Swagger docs, clear structure
6. **Flexible storage:** Local hoặc S3 (switch dễ dàng)
7. **Performance:** Streaming, caching, indexes
8. **Frontend integration:** Auto type generation

---

## 🎉 Tổng Kết

**Đây là một backend API hoàn chỉnh cho ứng dụng file storage**, với:

✅ **4 modules chính:** Auth, Files, Users, Health  
✅ **10+ endpoints:** Upload, download, view, stats, chunking, etc.  
✅ **Advanced features:** Video thumbnails, chunked upload, public sharing  
✅ **Enterprise-grade:** Logging, error handling, monitoring, docs  
✅ **Modern stack:** NestJS + Prisma + TypeScript + PostgreSQL  
✅ **Frontend-ready:** Swagger + auto type generation  

**Status:** Production Ready! 🚀

---

**Documentation:** [SUMMARY_VIETNAMESE.md](SUMMARY_VIETNAMESE.md) - Frontend integration guide
