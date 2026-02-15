# Dropbox App Backend

A production-ready NestJS REST API with JWT authentication, file management, and enterprise-grade best practices.

## ✨ Features

### Core Features
- ✅ NestJS framework with TypeScript
- ✅ Prisma ORM with PostgreSQL
- ✅ JWT Authentication (register, login, protected routes)
- ✅ File Upload & Management with Multer
- ✅ Swagger/OpenAPI documentation (`/api`)
- ✅ Health check endpoint

### Best Practices (New! 🎉)
- ✅ Structured Logger Service
- ✅ Soft Delete Extension for Prisma
- ✅ Centralized Constants Management
- ✅ Utility Helpers (string, date, file, pagination)
- ✅ Global Exception Filter
- ✅ Request Logging Interceptor
- ✅ Clean Architecture & Code Organization

## 📚 Documentation

### Main Documentation
- **[BEST_PRACTICES_SUMMARY.md](./BEST_PRACTICES_SUMMARY.md)** - Complete guide with all best practices, usage examples, and patterns

### Setup Guides
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick setup guide
- **[AUTH_GUIDE.md](./AUTH_GUIDE.md)** - Authentication guide
- **[FILE_UPLOAD_COMPLETE.md](./FILE_UPLOAD_COMPLETE.md)** - File upload guide
- **[DOCKER_SETUP.md](./DOCKER_SETUP.md)** - Docker setup guide
- **[API_DOCUMENTATION_IMPROVEMENTS.md](./API_DOCUMENTATION_IMPROVEMENTS.md)** - API documentation improvements

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env` and configure your environment variables:

```bash
cp .env.example .env
```

4. Update the `DATABASE_URL` in `.env` with your PostgreSQL connection string:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
```

## Prisma Setup

1. Generate Prisma Client:

```bash
npm run prisma:generate
```

2. Run database migrations:

```bash
npm run prisma:migrate
```

3. (Optional) Open Prisma Studio to view/edit data:

```bash
npm run prisma:studio
```

## Running the Application

### Development mode

```bash
npm run start:dev
```

### Production mode

```bash
npm run build
npm run start:prod
```

## API Documentation

Once the application is running, access the Swagger documentation at:

- **Swagger UI**: http://localhost:3000/api
- **Swagger JSON**: http://localhost:3000/api-json

## Available Endpoints

### Health Check

- **GET** `/health` - Returns the health status of the application

Example response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

## Project Structure

```
dropbox-app/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Database migrations
├── src/
│   ├── health/            # Health check module
│   │   ├── dto/
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   ├── prisma/            # Prisma module
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── app.module.ts      # Root module
│   └── main.ts            # Application entry point
├── .env                   # Environment variables (not in git)
├── .env.example           # Environment variables template
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## Available Scripts

- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with hot reload
- `npm run start:prod` - Start in production mode
- `npm run build` - Build the application
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Application port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `SWAGGER_TITLE` | Swagger documentation title | `Dropbox App API` |
| `SWAGGER_DESCRIPTION` | Swagger documentation description | - |
| `SWAGGER_VERSION` | API version | `1.0` |
| `SWAGGER_PATH` | Swagger UI path | `api` |

## License

ISC

# dropbox-app-BE
