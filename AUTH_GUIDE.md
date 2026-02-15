# Authentication Setup Guide

## Overview

This project now includes a complete JWT-based authentication system with:
- User registration
- User login
- JWT token generation
- Protected routes using JwtAuthGuard

## Prisma User Model

The User model has been updated with a password field:

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

## API Endpoints

### 1. Register - `POST /auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Error Responses:**
- `409 Conflict` - Email already exists

### 2. Login - `POST /auth/login`

Login with existing credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials

## Protected Routes

### Using JwtAuthGuard

To protect any route, use the `@UseGuards(JwtAuthGuard)` decorator:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('protected')
export class ProtectedController {
  @Get()
  @UseGuards(JwtAuthGuard)
  getProtectedData() {
    return { message: 'This is protected data' };
  }
}
```

### Example: User Profile Endpoint

**GET** `/user/profile` - Get current user profile (Protected)

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "message": "This is a protected route",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token

## Environment Variables

Add these to your `.env` file:

```env
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
```

**Important:** Change `JWT_SECRET` in production to a strong, unique value.

## Testing with cURL

### 1. Register a new user
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Access protected route
```bash
curl -X GET http://localhost:3000/user/profile \
  -H "Authorization: Bearer <your-access-token>"
```

## Testing with Swagger

1. Start the application: `yarn start:dev`
2. Open Swagger UI: http://localhost:3000/api
3. Register a new user via `/auth/register`
4. Copy the `accessToken` from the response
5. Click the "Authorize" button at the top right
6. Enter: `Bearer <your-access-token>`
7. Now you can test protected endpoints

## Security Features

- **Password Hashing**: Passwords are hashed using bcrypt (10 rounds)
- **JWT Tokens**: Stateless authentication using JSON Web Tokens
- **Token Expiration**: Tokens expire after 7 days (configurable)
- **Validation**: Input validation using class-validator
- **Guards**: Route protection using Passport JWT strategy

## Project Structure

```
src/
├── auth/
│   ├── dto/
│   │   ├── register.dto.ts
│   │   ├── login.dto.ts
│   │   └── auth-response.dto.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── user/
│   ├── user.controller.ts (example protected route)
│   └── user.module.ts
└── ...
```

## Next Steps

1. **Database Migration**: Run `npx prisma migrate dev` to create the User table
2. **Test Registration**: Register a new user via `/auth/register`
3. **Test Login**: Login and receive JWT token
4. **Test Protected Routes**: Use the token to access protected endpoints
5. **Add More Features**: 
   - Email verification
   - Password reset
   - Refresh tokens
   - Role-based access control (RBAC)

## Common Issues

### "User not found" error
- Make sure to run database migrations: `npx prisma migrate dev`

### Token not working
- Verify the token is sent in the `Authorization` header as `Bearer <token>`
- Check that JWT_SECRET in .env matches the one used to sign the token

### "Email already exists"
- This user is already registered, use the login endpoint instead

