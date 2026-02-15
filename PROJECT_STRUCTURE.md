# Project Structure - Dropbox-like NestJS Backend

## Overview

This is a clean, well-architected NestJS backend project following best practices and clean architecture principles.

## Technology Stack

- **NestJS** - Progressive Node.js framework
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Relational database
- **Swagger** - API documentation
- **TypeScript** - Static typing (strict mode)
- **JWT** - Authentication
- **bcrypt** - Password hashing

## Folder Structure

```
dropbox-app/
├── prisma/
│   ├── migrations/          # Database migrations
│   ├── schema.prisma        # Database schema definition
│   └── prisma.config.ts     # Prisma configuration
├── src/
│   ├── modules/             # Feature modules
│   │   ├── auth/           # Authentication module
│   │   │   ├── dto/
│   │   │   │   ├── auth-response.dto.ts
│   │   │   │   ├── login.dto.ts
│   │   │   │   └── register.dto.ts
│   │   │   ├── guards/
│   │   │   │   └── jwt-auth.guard.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   ├── health/         # Health check module
│   │   │   ├── dto/
│   │   │   │   └── health-check.dto.ts
│   │   │   ├── health.controller.ts
│   │   │   └── health.module.ts
│   │   └── user/           # User module (protected routes example)
│   │       ├── user.controller.ts
│   │       └── user.module.ts
│   ├── prisma/             # Prisma module
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── common/             # Shared utilities
│   │   ├── decorators/
│   │   │   ├── public.decorator.ts
│   │   │   ├── current-user.decorator.ts
│   │   │   └── index.ts
│   │   ├── filters/        # Exception filters
│   │   ├── guards/         # Shared guards
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── index.ts
│   │   ├── interceptors/   # Interceptors
│   │   └── pipes/          # Custom pipes
│   ├── app.module.ts       # Root module
│   └── main.ts             # Application entry point
├── dist/                   # Compiled output
├── .env                    # Environment variables (not in git)
├── .env.example            # Environment template
├── .gitignore
├── tsconfig.json           # TypeScript configuration
├── nest-cli.json           # NestJS CLI configuration
├── package.json
└── README.md
```

## Module Organization

### 1. Prisma Module (Global)
- **Location**: `src/prisma/`
- **Purpose**: Database access layer
- **Scope**: Global - available to all modules
- **Files**:
  - `prisma.service.ts` - Extends PrismaClient with lifecycle hooks
  - `prisma.module.ts` - Global module export

### 2. Health Module
- **Location**: `src/modules/health/`
- **Purpose**: Application health monitoring
- **Endpoint**: `GET /health`
- **Response**: `{ status: "ok", timestamp, uptime }`

### 3. Auth Module
- **Location**: `src/modules/auth/`
- **Purpose**: User authentication and authorization
- **Endpoints**:
  - `POST /auth/register` - User registration
  - `POST /auth/login` - User login (returns JWT)
- **Features**:
  - JWT token generation
  - Password hashing (bcrypt)
  - Input validation
  - Swagger documentation

### 4. User Module
- **Location**: `src/modules/user/`
- **Purpose**: User-related operations
- **Endpoints**:
  - `GET /user/profile` - Get current user (protected)
- **Example**: Shows how to use JwtAuthGuard

### 5. Common Module
- **Location**: `src/common/`
- **Purpose**: Shared utilities, decorators, guards, filters
- **Contents**:
  - `@Public()` decorator - Mark routes as public
  - `@CurrentUser()` decorator - Get authenticated user
  - `JwtAuthGuard` - Protect routes
  - Exception filters (to be added)
  - Custom pipes (to be added)

## API Endpoints

### Health Check
```
GET /health
Response: { status: "ok", timestamp: "...", uptime: 123.45 }
```

### Authentication
```
POST /auth/register
Body: { email, password, name? }
Response: { accessToken, user }

POST /auth/login
Body: { email, password }
Response: { accessToken, user }
```

### User (Protected)
```
GET /user/profile
Headers: Authorization: Bearer <token>
Response: { message, user }
```

## Swagger Documentation

- **UI**: http://localhost:3000/api
- **JSON Spec**: http://localhost:3000/api-json

Features:
- Interactive API testing
- Bearer token authentication
- Request/response schemas
- Full API documentation

## Database Schema

### User Model
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Environment Variables

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"

# Swagger
SWAGGER_TITLE="Dropbox App API"
SWAGGER_DESCRIPTION="API documentation for Dropbox App"
SWAGGER_VERSION="1.0"
SWAGGER_PATH="api"

# JWT
JWT_SECRET="<generated-secure-secret>"
JWT_EXPIRES_IN="7d"
```

## Key Features Implemented

### ✅ Core Setup
- [x] NestJS project structure
- [x] TypeScript strict mode
- [x] Environment configuration
- [x] Clean folder structure (modules/, prisma/, common/)

### ✅ Database
- [x] Prisma ORM setup
- [x] PostgreSQL configuration
- [x] PrismaService with lifecycle hooks
- [x] Global PrismaModule
- [x] User model with authentication fields

### ✅ API Documentation
- [x] Swagger setup at /api
- [x] JSON spec at /api-json
- [x] Bearer auth configuration
- [x] DTOs with ApiProperty decorators

### ✅ Health Check
- [x] GET /health endpoint
- [x] Returns status, timestamp, uptime
- [x] Swagger documentation

### ✅ Authentication
- [x] User registration endpoint
- [x] User login endpoint
- [x] JWT token generation
- [x] Password hashing (bcrypt)
- [x] JWT strategy (Passport)
- [x] JwtAuthGuard for route protection

### ✅ Common Utilities
- [x] @Public() decorator
- [x] @CurrentUser() decorator
- [x] JwtAuthGuard in common/guards
- [x] Organized exports

## Architecture Principles

### 1. Separation of Concerns
- Each module handles one domain
- Services contain business logic
- Controllers handle HTTP layer
- DTOs for data validation

### 2. Dependency Injection
- NestJS IoC container
- Constructor injection
- Modular architecture

### 3. Type Safety
- TypeScript strict mode
- Prisma type generation
- DTO validation

### 4. Security
- Password hashing
- JWT authentication
- Input validation
- CORS enabled

### 5. Scalability
- Modular structure
- Clean architecture
- Easy to add new modules
- Reusable common utilities

## Getting Started

### 1. Install Dependencies
```bash
yarn install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Setup Database
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio
npx prisma studio
```

### 4. Run Application
```bash
# Development
yarn start:dev

# Production
yarn build
yarn start:prod
```

### 5. Access Application
- API: http://localhost:3000
- Swagger: http://localhost:3000/api
- Health: http://localhost:3000/health

## Adding New Modules

### Create a new module in `src/modules/`:

```bash
mkdir -p src/modules/files
cd src/modules/files
```

### Create module files:

```typescript
// files.controller.ts
import { Controller } from '@nestjs/common';

@Controller('files')
export class FilesController {}

// files.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class FilesService {}

// files.module.ts
import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
```

### Register in AppModule:

```typescript
// app.module.ts
import { FilesModule } from './modules/files/files.module';

@Module({
  imports: [
    // ... other modules
    FilesModule,
  ],
})
export class AppModule {}
```

## Best Practices

1. **Use DTOs** for all input/output data
2. **Validate input** using class-validator
3. **Document APIs** with Swagger decorators
4. **Use guards** for route protection
5. **Keep services thin** - single responsibility
6. **Use decorators** for cross-cutting concerns
7. **Test your code** - unit and e2e tests
8. **Handle errors** properly with exception filters
9. **Log appropriately** for debugging
10. **Keep secrets secure** - never commit .env

## Next Steps

- [ ] Add file upload module
- [ ] Add folder management
- [ ] Add file sharing
- [ ] Add permissions system
- [ ] Add rate limiting
- [ ] Add logging (Winston/Pino)
- [ ] Add testing (Jest)
- [ ] Add CI/CD pipeline
- [ ] Add Docker support
- [ ] Add documentation (Compodoc)

## References

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Swagger/OpenAPI](https://swagger.io/specification/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

