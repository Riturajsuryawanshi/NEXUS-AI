@echo off
echo Starting Nexus-AI Local Development Server...
echo.
echo ========================================
echo   IMPORTANT: Use http://localhost:3000
echo   NOT nexus.supernovaind.com
echo ========================================
echo.
cd /d "%~dp0"
start http://localhost:3000
npm run dev
