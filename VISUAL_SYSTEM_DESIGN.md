# 🎨 Dropbox App - Visual System Design

> Visual diagrams và flowcharts để hiểu rõ hơn về system architecture

---

## 📐 **1. SYSTEM ARCHITECTURE LAYERS**

```
┌─────────────────────────────────────────────────────────────────┐
│                        🌐 CLIENT LAYER                           │
│                                                                   │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│   │ Web App      │  │ Mobile App   │  │ Desktop App  │        │
│   │ (React)      │  │ (React Native)│  │ (Electron)   │        │
│   └──────────────┘  └──────────────┘  └──────────────┘        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS/REST API
                             │ JWT Token Authentication
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    🛡️ API GATEWAY LAYER                         │
│                                                                   │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│   │ JWT Guard    │  │ Validation   │  │ Exception    │        │
│   │              │  │ Pipe         │  │ Filter       │        │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│          │                   │                  │                 │
│          └───────────────────┴──────────────────┘                │
│                              │                                    │
│                    ┌─────────▼─────────┐                        │
│                    │ Logging           │                        │
│                    │ Interceptor       │                        │
│                    └───────────────────┘                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    🎯 BUSINESS LOGIC LAYER                       │
│                                                                   │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│   │ 🔐 Auth      │  │ 👤 User      │  │ 📁 Files     │        │
│   │   Module     │  │   Module     │  │   Module     │        │
│   │              │  │              │  │              │        │
│   │ • Register   │  │ • Profile    │  │ • Upload     │        │
│   │ • Login      │  │ • Update     │  │ • List       │        │
│   │ • JWT Gen    │  │ • Stats      │  │ • Delete     │        │
│   └──────────────┘  └──────────────┘  │ • Strategy   │        │
│                                         └──────────────┘        │
│                                                                   │
│   ┌────────────────────────────────────────────────────┐        │
│   │         💡 Upload Recommendation Service           │        │
│   │  ┌──────────────┐  ┌──────────────┐              │        │
│   │  │ Chunk Size   │  │ Parallel     │              │        │
│   │  │ Calculator   │  │ Strategy     │              │        │
│   │  └──────────────┘  └──────────────┘              │        │
│   │  ┌──────────────┐  ┌──────────────┐              │        │
│   │  │ Batch        │  │ Network      │              │        │
│   │  │ Generator    │  │ Adapter      │              │        │
│   │  └──────────────┘  └──────────────┘              │        │
│   └────────────────────────────────────────────────────┘        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  🔧 INFRASTRUCTURE LAYER                         │
│                                                                   │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│   │ 🗄️ Prisma    │  │ ☁️ Storage   │  │ 📊 Logger    │        │
│   │    ORM       │  │   Service    │  │   Service    │        │
│   │              │  │              │  │              │        │
│   │ • Client Gen │  │ • S3 Primary │  │ • Structured │        │
│   │ • Migrations │  │ • Local Fall │  │ • Context    │        │
│   │ • Queries    │  │ • Abstraction│  │ • Levels     │        │
│   └──────┬───────┘  └──────┬───────┘  └──────────────┘        │
│          │                   │                                    │
└──────────┼───────────────────┼────────────────────────────────────┘
           │                   │
           ▼                   ▼
┌──────────────────┐  ┌─────────────────────────┐
│   🐘 PostgreSQL  │  │  ☁️ Storage Backends     │
│                  │  │                          │
│  ┌────────────┐  │  │  ┌────────┐  ┌────────┐│
│  │ Users      │  │  │  │ AWS S3 │  │ Local  ││
│  │ Files      │  │  │  │ Bucket │  │ FS     ││
│  └────────────┘  │  │  └────────┘  └────────┘│
│                  │  │                          │
│  • Indexes       │  │  • Multi-backend         │
│  • Soft Delete   │  │  • Auto-fallback         │
│  • Relations     │  │  • Configurable          │
└──────────────────┘  └─────────────────────────┘
```

---

## 🔄 **2. AUTHENTICATION FLOW**

```
┌────────────┐
│   Client   │
└─────┬──────┘
      │
      │ 1. POST /auth/register
      │    { email, password, name }
      ▼
┌────────────────────┐
│  Auth Controller   │
└─────┬──────────────┘
      │
      │ 2. Delegate to service
      ▼
┌────────────────────┐         ┌─────────────────┐
│   Auth Service     │─────────▶│  Check email    │
└─────┬──────────────┘         │  exists in DB   │
      │                         └─────────────────┘
      │ 3. Email unique?
      │    ├─ NO → Throw error (409)
      │    └─ YES → Continue
      │
      │ 4. Hash password (bcrypt)
      ▼
┌────────────────────┐
│  Bcrypt (10 rounds)│
└─────┬──────────────┘
      │
      │ 5. Create user in DB
      ▼
┌────────────────────┐         ┌─────────────────┐
│  Prisma Service    │─────────▶│   PostgreSQL    │
└─────┬──────────────┘         │   INSERT user   │
      │                         └─────────────────┘
      │ 6. User created
      │
      │ 7. Generate JWT token
      ▼
┌────────────────────┐
│   JWT Service      │
│  { userId, email } │
│  Sign with SECRET  │
│  Expires: 7 days   │
└─────┬──────────────┘
      │
      │ 8. Return response
      ▼
┌────────────────────┐
│     Response       │
│ { accessToken,     │
│   user: {...} }    │
└─────┬──────────────┘
      │
      ▼
┌────────────┐
│   Client   │
│ Store token│
└────────────┘

─────────────────────────────────────────────────

SUBSEQUENT REQUESTS:

┌────────────┐
│   Client   │
└─────┬──────┘
      │
      │ GET /users/me
      │ Authorization: Bearer <token>
      ▼
┌────────────────────┐
│   JWT Guard        │
│ 1. Extract token   │
│ 2. Verify signature│
│ 3. Check expiry    │
└─────┬──────────────┘
      │
      │ Valid? ├─ NO → 401 Unauthorized
      │        └─ YES → Continue
      ▼
┌────────────────────┐
│  Extract user from │
│  JWT payload       │
│  { userId: "..." } │
└─────┬──────────────┘
      │
      │ Attach to request.user
      ▼
┌────────────────────┐
│  Route Handler     │
│  @CurrentUser()    │
│  decorator         │
└─────┬──────────────┘
      │
      │ Return user data
      ▼
┌────────────┐
│   Client   │
└────────────┘
```

---

## 📤 **3. FILE UPLOAD FLOW**

```
┌────────────┐
│   Client   │
│  Select    │
│  File      │
└─────┬──────┘
      │
      │ 1. POST /files/upload
      │    multipart/form-data
      │    Authorization: Bearer <token>
      ▼
┌─────────────────────────────────────┐
│        Multer Middleware            │
│  Parse multipart/form-data          │
│  Extract file buffer                │
└─────┬───────────────────────────────┘
      │
      │ 2. File object created
      ▼
┌─────────────────────────────────────┐
│      Files Controller               │
└─────┬───────────────────────────────┘
      │
      │ 3. Pass to service
      ▼
┌─────────────────────────────────────┐
│       Files Service                 │
└─────┬───────────────────────────────┘
      │
      │ ┌──────────────────────────┐
      │ │ 4. Validate file         │
      ├─▶  • Check MIME type      │
      │ │  • Check file size      │
      │ │  • Check filename       │
      │ └──────────────────────────┘
      │
      │ Valid? ├─ NO → 400 Bad Request
      │        └─ YES → Continue
      │
      │ ┌──────────────────────────┐
      │ │ 5. Check user quota      │
      ├─▶  Query total file size  │
      │ │  Compare with limit     │
      │ └──────────────────────────┘
      │
      │ Under quota? ├─ NO → 400 Quota exceeded
      │              └─ YES → Continue
      │
      │ 6. Generate storage key
      │    users/{userId}/{year}/{month}/{timestamp}-{random}-{filename}
      │
      │ 7. Upload to storage
      ▼
┌─────────────────────────────────────┐
│      Storage Service                │
│      (Abstraction Layer)            │
└─────┬───────────────────────────────┘
      │
      ├────────────┬────────────┐
      │            │            │
      ▼            ▼            ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ S3       │ │ Local    │ │ Config   │
│ Provider │ │ Provider │ │ Check    │
└────┬─────┘ └────┬─────┘ └──────────┘
     │            │
     │ Try S3     │
     │            │ Fallback
     │            │
     ▼            ▼
┌──────────┐ ┌──────────┐
│ AWS S3   │ │ Local FS │
│ Bucket   │ │./uploads/│
└────┬─────┘ └────┬─────┘
     │            │
     └──────┬─────┘
            │
            │ 8. Upload success
            │    Return URL
            ▼
┌─────────────────────────────────────┐
│       Files Service                 │
│  9. Save metadata to database       │
└─────┬───────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│       Prisma Service                │
│  INSERT INTO files                  │
│  { name, size, mimeType,            │
│    path, userId }                   │
└─────┬───────────────────────────────┘
      │
      │ 10. File record created
      ▼
┌─────────────────────────────────────┐
│        Response                     │
│  { id, name, size, path, ... }      │
└─────┬───────────────────────────────┘
      │
      ▼
┌────────────┐
│   Client   │
│  Display   │
│  Success   │
└────────────┘
```

---

## 💡 **4. UPLOAD RECOMMENDATION ALGORITHM**

```
┌────────────────────────────────────────────────────┐
│         Upload Recommendation Service              │
└────────────────────────┬───────────────────────────┘
                         │
                         │ Input: fileSize, mimeType
                         ▼
        ┌────────────────────────────────┐
        │  1. ANALYZE FILE SIZE          │
        └────────┬───────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌─────────┐             ┌─────────┐
│< 50MB   │             │> 50MB   │
│REGULAR  │             │CHUNKED  │
└─────────┘             └────┬────┘
                             │
                             │
        ┌────────────────────┴────────────────────┐
        │  2. CALCULATE CHUNK SIZE                │
        │                                         │
        │  File < 100MB     → 5MB chunks         │
        │  File 100-500MB   → 10MB chunks        │
        │  File 500MB-2GB   → 20MB chunks        │
        │  File > 2GB       → 50MB chunks        │
        └────────┬────────────────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
        │  3. CALCULATE TOTAL CHUNKS     │
        │  totalChunks = ceil(           │
        │    fileSize / chunkSize        │
        │  )                             │
        └────────┬───────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
        │  4. DETERMINE PARALLEL COUNT   │
        │                                │
        │  File < 500MB  → 2 parallel   │
        │  File 500MB-2GB → 3 parallel  │
        │  File 2GB-5GB  → 4 parallel   │
        │  File > 5GB    → 5 parallel   │
        └────────┬───────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
        │  5. GENERATE BATCHES           │
        │  Using lodash.chunk()          │
        │                                │
        │  chunks = [0,1,2,...,N]       │
        │  batches = chunk(chunks, P)    │
        │                                │
        │  Example:                      │
        │  20 chunks, 3 parallel:       │
        │  [[0,1,2], [3,4,5], ...,      │
        │   [18,19]]                     │
        └────────┬───────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
        │  6. ESTIMATE TIME              │
        │  baseTime = fileSize /         │
        │             uploadSpeed        │
        │  parallelTime = baseTime *     │
        │                 (1/parallel)   │
        └────────┬───────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
        │  7. RETURN RECOMMENDATION      │
        │  {                             │
        │    recommendedMethod,          │
        │    chunkSize,                  │
        │    totalChunks,                │
        │    maxParallel,                │
        │    batches,                    │
        │    estimatedTime,              │
        │    warnings,                   │
        │    tips                        │
        │  }                             │
        └────────────────────────────────┘
```

---

## 🗃️ **5. STORAGE STRATEGY DECISION TREE**

```
                    ┌─────────────┐
                    │   START     │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────────────┐
                    │ Check STORAGE_TYPE  │
                    │ in .env             │
                    └──────┬──────────────┘
                           │
                ┋──────────┴──────────┋
                ▼                     ▼
        ┌───────────────┐     ┌───────────────┐
        │ STORAGE_TYPE  │     │ STORAGE_TYPE  │
        │ = "s3"        │     │ = "local"     │
        └───────┬───────┘     └───────┬───────┘
                │                     │
                ▼                     │
        ┌───────────────────┐        │
        │ Check S3 Config:  │        │
        │ • Bucket Name     │        │
        │ • Region          │        │
        │ • Access Key      │        │
        │ • Secret Key      │        │
        └───────┬───────────┘        │
                │                     │
      ┋─────────┴─────────┋          │
      ▼                   ▼          │
┌─────────────┐   ┌─────────────┐   │
│ All config  │   │ Missing     │   │
│ present     │   │ config      │   │
└──────┬──────┘   └──────┬──────┘   │
       │                 │           │
       │                 │ Warn &    │
       │                 │ Fallback  │
       │                 └────┬──────┘
       │                      │
       └──────────┬───────────┘
                  │
                  ▼
          ┌───────────────┐
          │ Use S3        │
          │ Provider      │
          └───────┬───────┘
                  │
                  └──────────────┬──────────────┐
                                 │              │
                                 ▼              ▼
                    ┌─────────────────┐  ┌─────────────────┐
                    │   Upload File   │  │  Delete File    │
                    └────────┬────────┘  └────────┬────────┘
                             │                    │
                    ┌────────┴─────────┐          │
                    ▼                  ▼          ▼
            ┌───────────┐      ┌───────────┐  ┌──────────┐
            │ S3 Success│      │ S3 Fails  │  │ Success  │
            └─────┬─────┘      └─────┬─────┘  └──────────┘
                  │                  │
                  │                  │ Auto Fallback
                  │                  ▼
                  │           ┌───────────────┐
                  │           │ Use Local     │
                  │           │ Provider      │
                  │           └───────┬───────┘
                  │                   │
                  └───────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Return URL    │
                    └───────────────┘


┌────────────────────────────────────────┐
│           LOCAL PROVIDER               │
│                                        │
│  Upload Path:                          │
│  ./uploads/users/{userId}/             │
│    {year}/{month}/                     │
│    {timestamp}-{random}-{filename}     │
│                                        │
│  Example:                              │
│  ./uploads/users/abc123/              │
│    2026/03/                            │
│    1234567890-999-video.mp4           │
└────────────────────────────────────────┘
```

---

## 🔍 **6. DATA FLOW DIAGRAM**

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT REQUEST                        │
│  { file: binary, metadata: {...}, token: JWT }          │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   Validation & Auth Layer     │
        │  • Verify JWT token           │
        │  • Validate file type         │
        │  • Check file size            │
        └───────────┬───────────────────┘
                    │
                    ▼
        ┌───────────────────────────────┐
        │    Business Logic Layer       │
        │  • Check user quota           │
        │  • Generate storage key       │
        │  • Process upload             │
        └───────────┬───────────────────┘
                    │
        ┏━━━━━━━━━━━┷━━━━━━━━━━━┓
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│   Storage     │       │   Database    │
│   (S3/Local)  │       │  (PostgreSQL) │
│               │       │               │
│ • Save file   │       │ • Save        │
│ • Return URL  │       │   metadata    │
└───────┬───────┘       └───────┬───────┘
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────────────┐
        │      Response Builder         │
        │  { success, message, data }   │
        └───────────┬───────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│                   CLIENT RESPONSE                        │
│  {                                                       │
│    "success": true,                                      │
│    "message": "File uploaded successfully",              │
│    "data": {                                            │
│      "id": "uuid",                                      │
│      "name": "video.mp4",                               │
│      "size": 50000000,                                  │
│      "path": "https://s3.../video.mp4",                 │
│      "mimeType": "video/mp4",                           │
│      "createdAt": "2026-03-05T10:00:00.000Z"           │
│    }                                                    │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 **7. MODULE DEPENDENCY GRAPH**

```
                    ┌──────────────┐
                    │  app.module  │
                    └───────┬──────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ config.module │   │ prisma.module │   │ logger.module │
└───────────────┘   └───────┬───────┘   └───────┬───────┘
                            │                   │
        ┌───────────────────┴───────────────────┤
        │                                       │
        ▼                                       ▼
┌───────────────┐                       ┌───────────────┐
│storage.module │                       │  ALL modules  │
└───────┬───────┘                       │  use logger   │
        │                               └───────────────┘
        │
        ├─────────────┬─────────────┐
        │             │             │
        ▼             ▼             ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│s3.provider   │ │local.provider│ │storage.service│
└──────────────┘ └──────────────┘ └───────┬───────┘
                                          │
                                          │ Used by
                                          ▼
                                  ┌───────────────┐
                                  │ files.module  │
                                  │               │
                                  │ • controller  │
                                  │ • service     │
                                  │ • upload-rec  │
                                  └───────┬───────┘
                                          │
                                          │ Protected by
                                          ▼
                                  ┌───────────────┐
                                  │  auth.module  │
                                  │               │
                                  │ • controller  │
                                  │ • service     │
                                  │ • jwt strategy│
                                  │ • jwt guard   │
                                  └───────┬───────┘
                                          │
                                          │ Manages
                                          ▼
                                  ┌───────────────┐
                                  │  user.module  │
                                  │               │
                                  │ • controller  │
                                  │ • (future)    │
                                  └───────────────┘
```

---

## 🎯 **8. REQUEST LIFECYCLE**

```
1. CLIENT SENDS REQUEST
   │
   ▼
2. NESTJS RECEIVES REQUEST
   │
   ├─▶ Global Logging Interceptor (BEFORE)
   │   └─▶ Log: "Incoming request"
   │
   ▼
3. MIDDLEWARE LAYER
   │
   ├─▶ CORS Check
   ├─▶ Body Parser
   └─▶ Multer (for file uploads)
   │
   ▼
4. GUARD LAYER
   │
   └─▶ JwtAuthGuard
       ├─ Extract token from header
       ├─ Verify signature
       ├─ Check expiration
       └─ Attach user to request
   │
   ▼
5. VALIDATION PIPE
   │
   └─▶ Validate DTOs
       ├─ Type checking
       ├─ Constraint validation
       └─ Transform data
   │
   ▼
6. CONTROLLER HANDLER
   │
   └─▶ Execute route handler
       └─▶ Call service method
   │
   ▼
7. SERVICE LAYER
   │
   ├─▶ Business logic
   ├─▶ Database queries
   └─▶ External API calls
   │
   ▼
8. RESPONSE
   │
   ├─▶ Transform to DTO
   └─▶ Wrap in standard format
   │
   ▼
9. INTERCEPTOR (AFTER)
   │
   └─▶ Log: "Request completed"
   │
   ▼
10. EXCEPTION FILTER (if error)
    │
    └─▶ Catch exceptions
        ├─▶ Log error
        ├─▶ Format error response
        └─▶ Return to client
   │
   ▼
11. SEND TO CLIENT
```

---

## 🔐 **9. SECURITY LAYERS**

```
┌─────────────────────────────────────────────┐
│         EXTERNAL THREATS                    │
│  • SQL Injection                            │
│  • XSS Attacks                              │
│  • Brute Force                              │
│  • Unauthorized Access                      │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│  DEFENSE LAYER 1: Network                   │
│  • HTTPS/TLS                                │
│  • CORS Configuration                       │
│  • Rate Limiting (optional)                 │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│  DEFENSE LAYER 2: Authentication            │
│  • JWT Token Verification                   │
│  • Token Expiration (7 days)                │
│  • Password Hashing (bcrypt, 10 rounds)     │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│  DEFENSE LAYER 3: Authorization             │
│  • Route Guards (JwtAuthGuard)              │
│  • Ownership Verification                   │
│  • Role-based access (future)               │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│  DEFENSE LAYER 4: Input Validation          │
│  • DTO Validation (class-validator)         │
│  • MIME Type Whitelist                      │
│  • File Size Limits                         │
│  • Filename Sanitization                    │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│  DEFENSE LAYER 5: Database                  │
│  • Parameterized Queries (Prisma)           │
│  • Soft Delete (data recovery)              │
│  • Transaction Support                      │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│  DEFENSE LAYER 6: Error Handling            │
│  • Generic Error Messages (client)          │
│  • Detailed Logging (server only)           │
│  • No Sensitive Data Exposure               │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│         PROTECTED APPLICATION               │
└─────────────────────────────────────────────┘
```

---

## 📈 **10. SCALABILITY PATH**

```
CURRENT STATE (MVP)
┌────────────────────────────────────────┐
│  ┌──────────┐    ┌──────────┐         │
│  │ NestJS   │───▶│PostgreSQL│         │
│  │ App      │    └──────────┘         │
│  └────┬─────┘                          │
│       │                                │
│       └──────────┐                     │
│                  ▼                     │
│           ┌──────────┐                 │
│           │ S3/Local │                 │
│           └──────────┘                 │
└────────────────────────────────────────┘
Single server, suitable for < 1000 users


STAGE 1: Basic Scaling
┌────────────────────────────────────────┐
│  ┌──────────┐    ┌──────────┐         │
│  │ NestJS   │───▶│PostgreSQL│         │
│  │ App ×2   │    │ (Primary)│         │
│  └────┬─────┘    └──────────┘         │
│       │                                │
│  ┌────┴─────┐                          │
│  │  Nginx   │ Load Balancer            │
│  │  LB      │                          │
│  └────┬─────┘                          │
│       └──────────┐                     │
│                  ▼                     │
│           ┌──────────┐                 │
│           │   AWS S3 │                 │
│           └──────────┘                 │
└────────────────────────────────────────┘
Horizontal scaling, < 10,000 users


STAGE 2: Optimized Scaling
┌────────────────────────────────────────────┐
│  ┌──────────┐    ┌──────────┐             │
│  │ NestJS   │───▶│PostgreSQL│             │
│  │ App ×N   │    │(Replica) │             │
│  └────┬─────┘    └─────┬────┘             │
│       │                │                  │
│  ┌────┴─────┐    ┌─────┴────┐             │
│  │  Nginx   │    │  Redis   │ Cache       │
│  │  LB      │    │  Cache   │             │
│  └────┬─────┘    └──────────┘             │
│       │                                   │
│       ├──────────┬──────────┐             │
│       ▼          ▼          ▼             │
│  ┌──────┐  ┌──────┐  ┌──────┐            │
│  │ AWS  │  │ CDN  │  │Queue │            │
│  │ S3   │  │(CF)  │  │(Bull)│            │
│  └──────┘  └──────┘  └──────┘            │
└────────────────────────────────────────────┘
< 100,000 users, high availability


STAGE 3: Enterprise Scaling
┌─────────────────────────────────────────────────┐
│         ┌──────────────┐                        │
│         │ API Gateway  │                        │
│         │ (Kong/AWS)   │                        │
│         └──────┬───────┘                        │
│                │                                 │
│      ┏━━━━━━━━━┻━━━━━━━━━┓                      │
│      ▼                    ▼                      │
│  ┌─────────┐        ┌─────────┐                 │
│  │ Auth    │        │ Files   │ Microservices   │
│  │ Service │        │ Service │                 │
│  └────┬────┘        └────┬────┘                 │
│       │                  │                       │
│       ├──────────────────┤                       │
│       │                  │                       │
│       ▼                  ▼                       │
│  ┌─────────┐        ┌─────────┐                 │
│  │ Postgres│        │ Postgres│ Sharded DBs     │
│  │ Shard 1 │        │ Shard 2 │                 │
│  └─────────┘        └─────────┘                 │
│       │                  │                       │
│       └────────┬─────────┘                       │
│                │                                 │
│                ▼                                 │
│         ┌──────────┐                             │
│         │  Redis   │ Distributed Cache           │
│         │ Cluster  │                             │
│         └──────────┘                             │
│                │                                 │
│       ┏━━━━━━━━┻━━━━━━━━┓                       │
│       ▼                 ▼                        │
│  ┌─────────┐       ┌─────────┐                  │
│  │  S3     │       │  CDN    │                  │
│  │ Multi   │       │ Global  │                  │
│  │ Region  │       │         │                  │
│  └─────────┘       └─────────┘                  │
└─────────────────────────────────────────────────┘
> 1,000,000 users, global distribution
```

---

**Generated:** March 5, 2026  
**Purpose:** Visual documentation for system understanding  
**Audience:** Developers, architects, technical stakeholders
