@echo off
REM ─────────────────────────────────────────────────────────────────────────────
REM  Tara Fitness Gym — Start All Services
REM  Run this as Administrator to start backend + biometric agent via PM2.
REM  Add this script to Windows Task Scheduler to auto-start on PC boot.
REM ─────────────────────────────────────────────────────────────────────────────

echo ============================================================
echo   TARA FITNESS GYM — STARTING SERVICES
echo ============================================================

REM Wait 15s for Windows networking to come up after boot
timeout /t 15 /nobreak >nul

REM Resurrect all PM2 processes saved with "pm2 save"
echo [1/2] Resurrecting PM2 processes...
call pm2 resurrect
if %ERRORLEVEL% NEQ 0 (
    echo [WARN] pm2 resurrect failed — starting individually...
    call pm2 start "d:\GYM WEBSITE\backend\server.js" --name "gym-backend" --cwd "d:\GYM WEBSITE\backend" 2>nul
    call pm2 start "d:\GYM WEBSITE\biometric-agent\agent.js" --name "biometric-agent" --cwd "d:\GYM WEBSITE\biometric-agent" 2>nul
)

echo [2/2] Saving PM2 process list...
call pm2 save

echo.
echo ============================================================
echo   Services started. Run "pm2 list" to check status.
echo ============================================================

