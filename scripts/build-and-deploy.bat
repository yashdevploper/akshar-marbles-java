@echo off
setlocal
cd /d "%~dp0..\backend"
mvn clean package -DskipTests
if errorlevel 1 exit /b %errorlevel%
docker build -t akshar-marbles-backend .