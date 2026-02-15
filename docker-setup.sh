#!/bin/bash

# Docker PostgreSQL Setup Script for Dropbox App
# This script helps you quickly set up and manage the PostgreSQL database

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🐳 Dropbox App - Docker PostgreSQL Setup${NC}"
echo ""

# Function to check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"
}

# Function to start PostgreSQL
start_postgres() {
    echo -e "${YELLOW}🚀 Starting PostgreSQL...${NC}"
    docker-compose up -d postgres
    
    echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
    sleep 5
    
    if docker-compose exec postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is ready!${NC}"
        echo ""
        echo "Connection details:"
        echo "  Host: localhost"
        echo "  Port: 5432"
        echo "  Database: dropbox_app"
        echo "  User: postgres"
        echo "  Password: postgres"
        echo ""
        echo "Connection string:"
        echo "  postgresql://postgres:postgres@localhost:5432/dropbox_app?schema=public"
    else
        echo -e "${RED}❌ PostgreSQL failed to start${NC}"
        docker-compose logs postgres
        exit 1
    fi
}

# Function to stop PostgreSQL
stop_postgres() {
    echo -e "${YELLOW}🛑 Stopping PostgreSQL...${NC}"
    docker-compose stop postgres
    echo -e "${GREEN}✅ PostgreSQL stopped${NC}"
}

# Function to restart PostgreSQL
restart_postgres() {
    echo -e "${YELLOW}🔄 Restarting PostgreSQL...${NC}"
    docker-compose restart postgres
    sleep 3
    echo -e "${GREEN}✅ PostgreSQL restarted${NC}"
}

# Function to show logs
show_logs() {
    echo -e "${YELLOW}📋 PostgreSQL Logs:${NC}"
    docker-compose logs -f postgres
}

# Function to run migrations
run_migrations() {
    echo -e "${YELLOW}🔄 Running Prisma migrations...${NC}"
    npx prisma migrate dev
    echo -e "${GREEN}✅ Migrations completed${NC}"
}

# Function to open Prisma Studio
open_studio() {
    echo -e "${YELLOW}🎨 Opening Prisma Studio...${NC}"
    npx prisma studio
}

# Function to reset database
reset_database() {
    echo -e "${RED}⚠️  This will delete all data!${NC}"
    read -p "Are you sure you want to reset the database? (yes/no): " confirm
    
    if [ "$confirm" = "yes" ]; then
        echo -e "${YELLOW}🗑️  Resetting database...${NC}"
        docker-compose down
        docker volume rm dropbox-app_postgres_data 2>/dev/null || true
        docker-compose up -d postgres
        sleep 5
        npx prisma migrate dev
        echo -e "${GREEN}✅ Database reset complete${NC}"
    else
        echo -e "${YELLOW}❌ Reset cancelled${NC}"
    fi
}

# Function to backup database
backup_database() {
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    echo -e "${YELLOW}💾 Creating backup: ${BACKUP_FILE}${NC}"
    docker-compose exec -T postgres pg_dump -U postgres dropbox_app > "$BACKUP_FILE"
    echo -e "${GREEN}✅ Backup created: ${BACKUP_FILE}${NC}"
}

# Function to show status
show_status() {
    echo -e "${YELLOW}📊 Docker Status:${NC}"
    docker-compose ps
    echo ""
    
    if docker-compose exec postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is running and ready${NC}"
        
        # Show database stats
        echo -e "\n${YELLOW}📈 Database Statistics:${NC}"
        docker-compose exec postgres psql -U postgres -d dropbox_app -c "
        SELECT 
            'Database Size' as metric,
            pg_size_pretty(pg_database_size('dropbox_app')) as value
        UNION ALL
        SELECT 
            'Users Count',
            COUNT(*)::text FROM \"User\"
        UNION ALL
        SELECT 
            'Files Count',
            COUNT(*)::text FROM \"File\";" 2>/dev/null || echo "Run migrations first"
    else
        echo -e "${RED}❌ PostgreSQL is not running${NC}"
    fi
}

# Main menu
show_menu() {
    echo ""
    echo "Select an option:"
    echo "  1) Start PostgreSQL"
    echo "  2) Stop PostgreSQL"
    echo "  3) Restart PostgreSQL"
    echo "  4) Show logs"
    echo "  5) Run migrations"
    echo "  6) Open Prisma Studio"
    echo "  7) Show status"
    echo "  8) Backup database"
    echo "  9) Reset database"
    echo "  0) Exit"
    echo ""
}

# Check Docker installation
check_docker

# If arguments provided, run specific command
if [ $# -gt 0 ]; then
    case "$1" in
        start)
            start_postgres
            ;;
        stop)
            stop_postgres
            ;;
        restart)
            restart_postgres
            ;;
        logs)
            show_logs
            ;;
        migrate)
            run_migrations
            ;;
        studio)
            open_studio
            ;;
        status)
            show_status
            ;;
        backup)
            backup_database
            ;;
        reset)
            reset_database
            ;;
        *)
            echo "Usage: $0 {start|stop|restart|logs|migrate|studio|status|backup|reset}"
            exit 1
            ;;
    esac
    exit 0
fi

# Interactive menu
while true; do
    show_menu
    read -p "Enter your choice: " choice
    
    case $choice in
        1)
            start_postgres
            ;;
        2)
            stop_postgres
            ;;
        3)
            restart_postgres
            ;;
        4)
            show_logs
            ;;
        5)
            run_migrations
            ;;
        6)
            open_studio
            ;;
        7)
            show_status
            ;;
        8)
            backup_database
            ;;
        9)
            reset_database
            ;;
        0)
            echo -e "${GREEN}👋 Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Invalid option${NC}"
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
done

