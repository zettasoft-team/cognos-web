@echo off
cd /d "%~dp0"

if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ERROR: npm install failed.
        pause
        exit /b 1
    )
)

echo Starting npm run dev...
npm run dev
