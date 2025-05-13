#!/bin/bash

# Docker Management Scripts for Realtime Whiteboard

echo "🐳 Docker Management for Realtime Whiteboard"
echo "============================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    print_status "Docker is running ✓"
}

# Development environment
dev() {
    print_status "Starting development environment..."
    check_docker
    
    # Create .env files if they don't exist
    if [ ! -f server/.env ]; then
        cp server/.env.example server/.env
        print_status "Created server/.env from example"
    fi
    
    if [ ! -f client/.env ]; then
        cp client/.env.example client/.env
        print_status "Created client/.env from example"
    fi
    
    docker-compose up --build
}

# Production environment
prod() {
    print_status "Starting production environment..."
    check_docker
    
    # Check for required environment variables
    if [ ! -f .env.prod ]; then
        print_error "Missing .env.prod file. Create it with production environment variables."
        exit 1
    fi
    
    docker-compose -f docker-compose.prod.yml --env-file .env.prod up --build -d
    print_status "Production environment started in detached mode"
    print_status "Access the application at: http://localhost"
}

# Stop all services
stop() {
    print_status "Stopping all services..."
    docker-compose down
    docker-compose -f docker-compose.prod.yml down 2>/dev/null
}

# Clean up (remove containers, volumes, images)
clean() {
    print_warning "This will remove all containers, volumes, and images for this project."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Cleaning up..."
        docker-compose down -v --rmi all
        docker-compose -f docker-compose.prod.yml down -v --rmi all 2>/dev/null
        print_status "Cleanup completed"
    else
        print_status "Cleanup cancelled"
    fi
}

# Show logs
logs() {
    service=${2:-""}
    if [ -n "$service" ]; then
        docker-compose logs -f "$service"
    else
        docker-compose logs -f
    fi
}

# Show status
status() {
    print_status "Container Status:"
    docker-compose ps
    echo
    print_status "Resource Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# Database operations
db_reset() {
    print_warning "This will reset the database and seed it with initial data."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Resetting database..."
        docker-compose exec server npm run db:reset
        print_status "Database reset completed"
    else
        print_status "Database reset cancelled"
    fi
}

# Help
help() {
    echo "Usage: $0 {dev|prod|stop|clean|logs|status|db-reset|help}"
    echo
    echo "Commands:"
    echo "  dev        Start development environment"
    echo "  prod       Start production environment"
    echo "  stop       Stop all services"
    echo "  clean      Remove all containers, volumes, and images"
    echo "  logs       Show logs (optionally specify service name)"
    echo "  status     Show container status and resource usage"
    echo "  db-reset   Reset and seed the database"
    echo "  help       Show this help message"
    echo
    echo "Examples:"
    echo "  $0 dev"
    echo "  $0 logs server"
    echo "  $0 status"
}

# Main script logic
case "$1" in
    dev)
        dev
        ;;
    prod)
        prod
        ;;
    stop)
        stop
        ;;
    clean)
        clean
        ;;
    logs)
        logs "$@"
        ;;
    status)
        status
        ;;
    db-reset)
        db_reset
        ;;
    help|*)
        help
        ;;
esac
