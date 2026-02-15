# Docker Setup Guide - PostgreSQL + NestJS

## 🐳 Docker Files Created

1. **docker-compose.yml** - PostgreSQL service configuration
2. **Dockerfile** - NestJS application containerization
3. **.dockerignore** - Optimize Docker build
4. **.env.docker** - Docker-specific environment variables

## 🚀 Quick Start

### Option 1: PostgreSQL Only (Recommended for Development)

Run PostgreSQL in Docker, NestJS locally:

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
docker-compose logs -f postgres

# Run migrations
npx prisma migrate dev

# Start NestJS locally
yarn start:dev
```

### Option 2: Full Docker Setup

Run both PostgreSQL and NestJS in Docker:

```bash
# Uncomment the 'app' service in docker-compose.yml first
# Then run:
docker-compose up -d

# Run migrations
docker-compose exec app npx prisma migrate dev

# View logs
docker-compose logs -f
```

## 📦 PostgreSQL Configuration

### Connection Details

**When PostgreSQL runs in Docker:**

```env
# For local NestJS app connecting to Docker PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dropbox_app?schema=public"

# For NestJS app in Docker connecting to PostgreSQL in Docker
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/dropbox_app?schema=public"
```

### Default Credentials

- **Host**: localhost (or `postgres` if app in Docker)
- **Port**: 5432
- **Database**: dropbox_app
- **User**: postgres
- **Password**: postgres

**⚠️ Change these in production!**

## 🔧 Docker Commands

### PostgreSQL Container

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Stop PostgreSQL
docker-compose stop postgres

# Remove PostgreSQL (keeps data)
docker-compose down

# Remove PostgreSQL + data
docker-compose down -v

# View logs
docker-compose logs -f postgres

# Access PostgreSQL CLI
docker-compose exec postgres psql -U postgres -d dropbox_app
```

### Full Application

```bash
# Build and start all services
docker-compose up --build

# Start in detached mode
docker-compose up -d

# Stop all services
docker-compose down

# Rebuild app service
docker-compose up --build app

# View logs
docker-compose logs -f app

# Execute commands in app container
docker-compose exec app yarn prisma:generate
docker-compose exec app yarn prisma:migrate
```

## 🗄️ Database Management

### Run Migrations

```bash
# If NestJS runs locally
npx prisma migrate dev

# If NestJS runs in Docker
docker-compose exec app npx prisma migrate dev
```

### Prisma Studio

```bash
# If NestJS runs locally
npx prisma studio

# If NestJS runs in Docker
docker-compose exec app npx prisma studio
```

### Backup Database

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres dropbox_app > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres dropbox_app < backup.sql
```

### Reset Database

```bash
# Stop containers
docker-compose down

# Remove volume (deletes all data)
docker volume rm dropbox-app_postgres_data

# Start fresh
docker-compose up -d postgres
npx prisma migrate dev
```

## 📝 Docker Compose Configuration

### PostgreSQL Service

```yaml
postgres:
  image: postgres:16-alpine       # PostgreSQL 16 (Alpine for smaller size)
  container_name: dropbox-postgres
  restart: always                 # Auto-restart on failure
  environment:
    POSTGRES_USER: postgres       # Database user
    POSTGRES_PASSWORD: postgres   # Database password
    POSTGRES_DB: dropbox_app      # Database name
  ports:
    - "5432:5432"                 # Expose port to host
  volumes:
    - postgres_data:/var/lib/postgresql/data  # Persist data
  networks:
    - dropbox-network
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U postgres"]
    interval: 10s
    timeout: 5s
    retries: 5
```

### Key Features:

- ✅ **Persistent Storage**: Data saved in Docker volume
- ✅ **Health Check**: Ensures database is ready
- ✅ **Auto-restart**: Recovers from failures
- ✅ **Network Isolation**: Secure communication
- ✅ **Port Mapping**: Accessible from host

## 🔒 Production Considerations

### Environment Variables

Create `.env.production`:

```env
NODE_ENV=production
PORT=3000

# Use strong passwords
DATABASE_URL="postgresql://dbuser:STRONG_PASSWORD@postgres:5432/dropbox_app?schema=public"

# Production database credentials
POSTGRES_USER=dbuser
POSTGRES_PASSWORD=STRONG_PASSWORD
POSTGRES_DB=dropbox_app

# Strong JWT secret
JWT_SECRET="your-production-secret-512-bits"
JWT_EXPIRES_IN="7d"
```

### Docker Compose Production

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - dropbox-network
    # Don't expose port to host in production
    # ports:
    #   - "5432:5432"

  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    volumes:
      - ./uploads:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - dropbox-network
```

## 🧪 Testing Connection

### Test PostgreSQL Connection

```bash
# From host machine
psql -h localhost -p 5432 -U postgres -d dropbox_app

# Or using Docker
docker-compose exec postgres psql -U postgres -d dropbox_app

# Test query
SELECT version();
```

### Test NestJS Connection

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Update .env to use localhost
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dropbox_app?schema=public"

# Run migrations
npx prisma migrate dev

# Start app
yarn start:dev

# Test health endpoint
curl http://localhost:3000/health
```

## 📊 Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# PostgreSQL only
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 postgres
```

### Container Stats

```bash
# View resource usage
docker stats dropbox-postgres

# View all running containers
docker-compose ps
```

### Database Size

```bash
docker-compose exec postgres psql -U postgres -d dropbox_app -c "
SELECT 
  pg_size_pretty(pg_database_size('dropbox_app')) as size;
"
```

## 🛠️ Troubleshooting

### PostgreSQL won't start

```bash
# Check logs
docker-compose logs postgres

# Check if port 5432 is already in use
lsof -i :5432

# Remove old container
docker-compose down
docker-compose up -d postgres
```

### Can't connect to database

```bash
# Check PostgreSQL is running
docker-compose ps

# Check health
docker-compose exec postgres pg_isready -U postgres

# Verify connection string in .env
echo $DATABASE_URL
```

### Data loss after restart

```bash
# Check volumes exist
docker volume ls | grep postgres

# Volume should persist across restarts
# Only deleted with: docker-compose down -v
```

## 📚 Useful Commands

```bash
# View PostgreSQL tables
docker-compose exec postgres psql -U postgres -d dropbox_app -c "\dt"

# Count records
docker-compose exec postgres psql -U postgres -d dropbox_app -c "
SELECT 'users' as table, COUNT(*) FROM \"User\"
UNION ALL
SELECT 'files' as table, COUNT(*) FROM \"File\";
"

# Export schema
docker-compose exec postgres pg_dump -U postgres -s dropbox_app > schema.sql

# Shell into PostgreSQL container
docker-compose exec postgres sh
```

## 🎯 Development Workflow

### Recommended Setup:

1. **Start PostgreSQL in Docker**
   ```bash
   docker-compose up -d postgres
   ```

2. **Run NestJS locally** (faster development)
   ```bash
   yarn start:dev
   ```

3. **Access Database**
   ```bash
   npx prisma studio
   ```

### Advantages:
- ✅ Fast hot-reload for NestJS
- ✅ Easy debugging
- ✅ Isolated database
- ✅ No local PostgreSQL installation needed

## 🚀 Deployment

### Build Production Image

```bash
# Build NestJS app
docker build -t dropbox-app:latest .

# Run with production compose
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Push to Registry

```bash
# Tag image
docker tag dropbox-app:latest your-registry/dropbox-app:latest

# Push
docker push your-registry/dropbox-app:latest
```

## ✅ Summary

**PostgreSQL Docker setup complete!**

Features:
- ✅ PostgreSQL 16 in Docker
- ✅ Persistent data storage
- ✅ Health checks
- ✅ Easy connection configuration
- ✅ Development & production ready
- ✅ Backup & restore support
- ✅ Full Docker compose setup

**Get started:**
```bash
docker-compose up -d postgres
npx prisma migrate dev
yarn start:dev
```

**Access application:**
- API: http://localhost:3000
- Swagger: http://localhost:3000/api
- Database: postgresql://postgres:postgres@localhost:5432/dropbox_app

🎉 Ready to develop!

