# Base image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json yarn.lock* package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies
RUN if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    else npm install; fi

# Generate Prisma Client
RUN npx prisma generate

# Build the application
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the NestJS application
RUN yarn build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Create uploads directory
RUN mkdir -p uploads && chown -R nestjs:nodejs uploads

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main"]


