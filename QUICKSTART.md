# Quick Start Guide

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Update the `.env` file with your PostgreSQL credentials:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dropbox_app?schema=public"
```

### 3. Setup Database
```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations (when you have a database ready)
npm run prisma:migrate
```

### 4. Start Development Server
```bash
npm run start:dev
```

The application will be available at:
- **API**: http://localhost:3000
- **Swagger UI**: http://localhost:3000/api
- **Swagger JSON**: http://localhost:3000/api-json

### 5. Test Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-15T...",
  "uptime": 5.123
}
```

## 📝 What's Included

✅ **NestJS** - Progressive Node.js framework  
✅ **Prisma ORM** - Type-safe database access  
✅ **PostgreSQL** - Powerful relational database  
✅ **Swagger** - Interactive API documentation  
✅ **TypeScript** - Type safety and modern JS features  
✅ **Environment Config** - Centralized configuration  
✅ **Health Check** - Application monitoring endpoint  

## 🔧 Key Files

- `src/main.ts` - Application entry point with Swagger setup
- `src/app.module.ts` - Root module configuration
- `src/prisma/` - Prisma service and module (Global)
- `src/health/` - Health check endpoint
- `prisma/schema.prisma` - Database schema
- `.env` - Environment variables

## 📦 Next Steps

1. **Add Authentication** - Implement JWT or OAuth
2. **Create Models** - Define your data models in `schema.prisma`
3. **Build APIs** - Create controllers and services
4. **Add Validation** - Use class-validator decorators
5. **Write Tests** - Add unit and e2e tests

## 🛠️ Common Commands

```bash
# Development
npm run start:dev          # Start with hot reload

# Build
npm run build              # Compile TypeScript

# Production
npm run start:prod         # Start production server

# Database
npm run prisma:generate    # Generate Prisma Client
npm run prisma:migrate     # Run migrations
npm run prisma:studio      # Open Prisma Studio GUI
```

## 📚 Documentation

- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [Swagger/OpenAPI](https://swagger.io/docs/)

Happy coding! 🎉

