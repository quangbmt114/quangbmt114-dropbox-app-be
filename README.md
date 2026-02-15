# Dropbox App

A NestJS application with Prisma ORM, PostgreSQL database, and Swagger documentation.

## Features

- ✅ NestJS framework
- ✅ Prisma ORM with PostgreSQL
- ✅ Swagger API documentation (available at `/api` and `/api-json`)
- ✅ Environment configuration
- ✅ Health check endpoint
- ✅ TypeScript support
- ✅ Global validation pipes

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
