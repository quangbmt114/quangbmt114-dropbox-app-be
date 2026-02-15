# Hướng Dẫn Docker PostgreSQL - Dropbox App

## 🚀 Khởi Động Nhanh

### Cách 1: Sử dụng Script (Khuyến nghị)

```bash
# Chạy script tương tác
./docker-setup.sh

# Hoặc chạy lệnh trực tiếp
./docker-setup.sh start     # Khởi động PostgreSQL
./docker-setup.sh stop      # Dừng PostgreSQL
./docker-setup.sh migrate   # Chạy migrations
./docker-setup.sh status    # Xem trạng thái
```

### Cách 2: Sử dụng Docker Compose

```bash
# 1. Khởi động PostgreSQL
docker-compose up -d postgres

# 2. Chạy migrations
npx prisma migrate dev

# 3. Khởi động ứng dụng
yarn start:dev
```

## 📦 Các File Đã Tạo

1. **docker-compose.yml** - Cấu hình PostgreSQL container
2. **Dockerfile** - Đóng gói NestJS application
3. **.dockerignore** - Tối ưu Docker build
4. **.env.docker** - Biến môi trường cho Docker
5. **docker-setup.sh** - Script quản lý database
6. **DOCKER_SETUP.md** - Hướng dẫn chi tiết

## 🔧 Cấu Hình Kết Nối

### Thông Tin Database

```
Host: localhost
Port: 5432
Database: dropbox_app
User: postgres
Password: postgres
```

### Connection String

**Khi NestJS chạy trên máy local:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dropbox_app?schema=public"
```

**Khi NestJS chạy trong Docker:**
```env
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/dropbox_app?schema=public"
```

## 📝 Các Lệnh Thường Dùng

### Quản Lý Container

```bash
# Khởi động PostgreSQL
docker-compose up -d postgres

# Dừng PostgreSQL
docker-compose stop postgres

# Xem logs
docker-compose logs -f postgres

# Khởi động lại
docker-compose restart postgres

# Xóa container (giữ data)
docker-compose down

# Xóa container + data
docker-compose down -v
```

### Quản Lý Database

```bash
# Chạy migrations
npx prisma migrate dev

# Tạo migration mới
npx prisma migrate dev --name ten_migration

# Mở Prisma Studio
npx prisma studio

# Generate Prisma Client
npx prisma generate
```

### Truy Cập PostgreSQL

```bash
# Kết nối vào PostgreSQL CLI
docker-compose exec postgres psql -U postgres -d dropbox_app

# Hoặc từ máy local
psql -h localhost -p 5432 -U postgres -d dropbox_app

# Xem danh sách tables
\dt

# Thoát
\q
```

## 🗄️ Backup & Restore

### Backup Database

```bash
# Tạo backup
docker-compose exec postgres pg_dump -U postgres dropbox_app > backup.sql

# Hoặc dùng script
./docker-setup.sh backup
```

### Restore Database

```bash
# Restore từ backup
docker-compose exec -T postgres psql -U postgres dropbox_app < backup.sql
```

### Reset Database (Xóa tất cả data)

```bash
# Sử dụng script
./docker-setup.sh reset

# Hoặc thủ công
docker-compose down -v
docker-compose up -d postgres
npx prisma migrate dev
```

## 🔍 Kiểm Tra & Debug

### Kiểm tra trạng thái

```bash
# Xem trạng thái containers
docker-compose ps

# Xem trạng thái PostgreSQL
./docker-setup.sh status

# Kiểm tra kết nối
docker-compose exec postgres pg_isready -U postgres
```

### Xem logs

```bash
# Xem tất cả logs
docker-compose logs -f postgres

# Xem 100 dòng cuối
docker-compose logs --tail=100 postgres

# Hoặc dùng script
./docker-setup.sh logs
```

### Thống kê database

```bash
# Xem kích thước database
docker-compose exec postgres psql -U postgres -d dropbox_app -c "
SELECT pg_size_pretty(pg_database_size('dropbox_app')) as size;
"

# Đếm số records
docker-compose exec postgres psql -U postgres -d dropbox_app -c "
SELECT 'users' as table, COUNT(*) FROM \"User\"
UNION ALL
SELECT 'files' as table, COUNT(*) FROM \"File\";
"
```

## 🎯 Workflow Phát Triển

### Quy trình làm việc khuyến nghị:

```bash
# 1. Khởi động PostgreSQL trong Docker
docker-compose up -d postgres

# 2. Chạy migrations
npx prisma migrate dev

# 3. Khởi động NestJS ở chế độ development
yarn start:dev

# 4. Mở Prisma Studio để quản lý data (optional)
npx prisma studio
```

### Ưu điểm:
- ✅ Hot-reload nhanh cho NestJS
- ✅ Dễ debug
- ✅ Database độc lập
- ✅ Không cần cài PostgreSQL trên máy

## 🚨 Xử Lý Lỗi

### PostgreSQL không khởi động được

```bash
# Kiểm tra logs
docker-compose logs postgres

# Kiểm tra port 5432 đã được dùng chưa
lsof -i :5432

# Xóa container cũ và tạo lại
docker-compose down
docker-compose up -d postgres
```

### Không kết nối được database

```bash
# Kiểm tra PostgreSQL đang chạy
docker-compose ps

# Kiểm tra health status
docker-compose exec postgres pg_isready -U postgres

# Kiểm tra connection string trong .env
cat .env | grep DATABASE_URL
```

### Mất data sau khi restart

```bash
# Kiểm tra volume có tồn tại không
docker volume ls | grep postgres

# Volume sẽ được giữ lại khi restart
# Chỉ bị xóa khi chạy: docker-compose down -v
```

## 📚 Các Lệnh PostgreSQL Hữu Ích

```sql
-- Xem danh sách databases
\l

-- Xem danh sách tables
\dt

-- Xem cấu trúc table
\d "User"
\d "File"

-- Xem tất cả users
SELECT * FROM "User";

-- Xem tất cả files
SELECT * FROM "File";

-- Xem files của một user cụ thể
SELECT f.* FROM "File" f
JOIN "User" u ON f."userId" = u.id
WHERE u.email = 'user@example.com';

-- Đếm số files của mỗi user
SELECT 
    u.email,
    COUNT(f.id) as file_count
FROM "User" u
LEFT JOIN "File" f ON u.id = f."userId"
GROUP BY u.id, u.email;
```

## 🎨 Menu Script Tương Tác

Chạy script không tham số để mở menu:

```bash
./docker-setup.sh
```

Menu options:
1. Start PostgreSQL - Khởi động database
2. Stop PostgreSQL - Dừng database
3. Restart PostgreSQL - Khởi động lại
4. Show logs - Xem logs
5. Run migrations - Chạy migrations
6. Open Prisma Studio - Mở giao diện quản lý
7. Show status - Xem trạng thái
8. Backup database - Sao lưu database
9. Reset database - Reset database (xóa data)
0. Exit - Thoát

## ✅ Kiểm Tra Setup

### Test kết nối từ máy local

```bash
# Test bằng psql
psql -h localhost -p 5432 -U postgres -d dropbox_app -c "SELECT version();"

# Test bằng NestJS
yarn start:dev
curl http://localhost:3000/health
```

### Test endpoints

```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🔐 Bảo Mật Production

### Đổi password PostgreSQL

1. Sửa file `docker-compose.yml`:
```yaml
environment:
  POSTGRES_USER: your_user
  POSTGRES_PASSWORD: STRONG_PASSWORD
  POSTGRES_DB: dropbox_app
```

2. Cập nhật `.env`:
```env
DATABASE_URL="postgresql://your_user:STRONG_PASSWORD@localhost:5432/dropbox_app?schema=public"
```

3. Khởi động lại:
```bash
docker-compose down -v
docker-compose up -d postgres
npx prisma migrate dev
```

## 📖 Tài Liệu Chi Tiết

Xem file **DOCKER_SETUP.md** để biết thêm chi tiết về:
- Cấu hình nâng cao
- Production setup
- Monitoring
- Troubleshooting
- Best practices

## 🎉 Hoàn Tất!

Setup Docker PostgreSQL đã sẵn sàng! 

**Bắt đầu ngay:**
```bash
./docker-setup.sh start
yarn start:dev
```

**Truy cập ứng dụng:**
- API: http://localhost:3000
- Swagger: http://localhost:3000/api
- Database: localhost:5432

Chúc bạn code vui vẻ! 🚀

