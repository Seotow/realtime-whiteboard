@echo off
REM Docker Management Scripts for Realtime Whiteboard (Windows)

set GREEN=[92m
set YELLOW=[93m
set RED=[91m
set NC=[0m

echo %GREEN%Docker Management for Realtime Whiteboard%NC%
echo =============================================

goto %1 2>nul || goto help

:check_docker
docker info >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR] Docker is not running. Please start Docker first.%NC%
    exit /b 1
)
echo %GREEN%[INFO] Docker is running%NC%
goto :eof

:dev
echo %GREEN%[INFO] Starting development environment...%NC%
call :check_docker
if errorlevel 1 exit /b 1

REM Create .env files if they don't exist
if not exist server\.env (
    copy server\.env.example server\.env >nul
    echo %GREEN%[INFO] Created server\.env from example%NC%
)

if not exist client\.env (
    copy client\.env.example client\.env >nul
    echo %GREEN%[INFO] Created client\.env from example%NC%
)

docker-compose up --build
goto :eof

:prod
echo %GREEN%[INFO] Starting production environment...%NC%
call :check_docker
if errorlevel 1 exit /b 1

if not exist .env.prod (
    echo %RED%[ERROR] Missing .env.prod file. Create it with production environment variables.%NC%
    exit /b 1
)

docker-compose -f docker-compose.prod.yml --env-file .env.prod up --build -d
echo %GREEN%[INFO] Production environment started in detached mode%NC%
echo %GREEN%[INFO] Access the application at: http://localhost%NC%
goto :eof

:stop
echo %GREEN%[INFO] Stopping all services...%NC%
docker-compose down
docker-compose -f docker-compose.prod.yml down 2>nul
goto :eof

:clean
echo %YELLOW%[WARNING] This will remove all containers, volumes, and images for this project.%NC%
set /p confirm="Are you sure? (y/N): "
if /i "%confirm%"=="y" (
    echo %GREEN%[INFO] Cleaning up...%NC%
    docker-compose down -v --rmi all
    docker-compose -f docker-compose.prod.yml down -v --rmi all 2>nul
    echo %GREEN%[INFO] Cleanup completed%NC%
) else (
    echo %GREEN%[INFO] Cleanup cancelled%NC%
)
goto :eof

:logs
if "%2"=="" (
    docker-compose logs -f
) else (
    docker-compose logs -f %2
)
goto :eof

:status
echo %GREEN%[INFO] Container Status:%NC%
docker-compose ps
echo.
echo %GREEN%[INFO] Resource Usage:%NC%
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
goto :eof

:db-reset
echo %YELLOW%[WARNING] This will reset the database and seed it with initial data.%NC%
set /p confirm="Are you sure? (y/N): "
if /i "%confirm%"=="y" (
    echo %GREEN%[INFO] Resetting database...%NC%
    docker-compose exec server npm run db:reset
    echo %GREEN%[INFO] Database reset completed%NC%
) else (
    echo %GREEN%[INFO] Database reset cancelled%NC%
)
goto :eof

:help
echo Usage: %0 {dev^|prod^|stop^|clean^|logs^|status^|db-reset^|help}
echo.
echo Commands:
echo   dev        Start development environment
echo   prod       Start production environment
echo   stop       Stop all services
echo   clean      Remove all containers, volumes, and images
echo   logs       Show logs (optionally specify service name)
echo   status     Show container status and resource usage
echo   db-reset   Reset and seed the database
echo   help       Show this help message
echo.
echo Examples:
echo   %0 dev
echo   %0 logs server
echo   %0 status
goto :eof
