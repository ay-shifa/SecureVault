@echo off
title SecureVault Web Application
echo ========================================================
echo        Starting SecureVault Web Application
echo ========================================================
echo.
echo Checking Node.js installation...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Starting server...
start http://localhost:3000
node server.js
pause
