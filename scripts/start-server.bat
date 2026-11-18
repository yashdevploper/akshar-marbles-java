@echo off
setlocal
cd /d "%~dp0..\backend"
mvn clean package -DskipTests
if errorlevel 1 exit /b %errorlevel%
docker build -t akshar-marbles-backend .
docker rm -f akshar-marbles-backend >nul 2>&1
docker run --name akshar-marbles-backend -p 8080:8080 -e APP_ENVIRONMENT=development akshar-marbles-backend