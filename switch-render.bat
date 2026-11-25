@echo off
REM ═══════════════════════════════════════════════════════════════════
REM  TARA FITNESS GYM — Render Account Switcher
REM  Run this when Render suspends due to 5GB bandwidth limit.
REM  It updates all config files and redeploys frontend to Vercel.
REM
REM  ACCOUNTS:
REM    ACCOUNT A: ravipatil7512@gmail.com  → gymwebsite-1-kj55.onrender.com
REM    ACCOUNT B: ravipatil1761@gmail.com  → (set ACCOUNT_B_URL below after deploy)
REM ═══════════════════════════════════════════════════════════════════

REM ── CONFIGURE THESE TWO URLs ──────────────────────────────────────
REM Account A (ravipatil7512) — existing Render service
set ACCOUNT_A_URL=https://gymwebsite-1-kj55.onrender.com

REM Account B (ravipatil1761) — NEW Render service (fill this after you deploy it)
set ACCOUNT_B_URL=https://gymwebsite-e0lr.onrender.com
REM ──────────────────────────────────────────────────────────────────

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║     TARA FITNESS GYM — Render Account Switcher      ║
echo ╚══════════════════════════════════════════════════════╝
echo.
echo  Choose which Render account to activate:
echo.
echo  [A] Account A — ravipatil7512@gmail.com  (Original)
echo  [B] Account B — ravipatil1761@gmail.com  (Backup)
echo.
set /p CHOICE="Enter A or B: "

if /i "%CHOICE%"=="A" (
    set TARGET_URL=%ACCOUNT_A_URL%
    set ACTIVE_MAIL=ravipatil7512@gmail.com
) else if /i "%CHOICE%"=="B" (
    set TARGET_URL=%ACCOUNT_B_URL%
    set ACTIVE_MAIL=ravipatil1761@gmail.com
) else (
    echo [ERROR] Invalid choice. Enter A or B only.
    pause
    exit /b 1
)

echo.
echo ══════════════════════════════════════════════════════
echo  Switching to: %ACTIVE_MAIL%
echo  Backend URL : %TARGET_URL%
echo ══════════════════════════════════════════════════════
echo.

REM ── Step 1: Update frontend/vercel.json ───────────────────────────
echo [1/4] Updating frontend\vercel.json...
(
echo {
echo     "routes": [
echo         {
echo             "src": "/api/(.*^)",
echo             "dest": "%TARGET_URL%/api/$1"
echo         },
echo         {
echo             "handle": "filesystem"
echo         },
echo         {
echo             "src": "/(.*^)",
echo             "dest": "/index.html"
echo         }
echo     ]
echo }
) > "d:\GYM WEBSITE\frontend\vercel.json"
echo     ✅ vercel.json updated.

REM ── Step 2: Update biometric-agent/.env ───────────────────────────
echo [2/4] Updating biometric-agent\.env...
(
echo # ZKTeco K40 Pro Machine IP ^& Port ^(Local Gym Network^)
echo DEVICE_IP=192.168.1.201
echo DEVICE_PORT=4370
echo.
echo # Gym Website Cloud Backend Endpoint ^(Render Production^)
echo CLOUD_API_URL=%TARGET_URL%/api/attendance/biometric-punch
echo.
echo # Secret bridge key ^(must match BIOMETRIC_BRIDGE_SECRET in backend .env^)
echo BIOMETRIC_BRIDGE_SECRET=gym_biometric_secret_2026
echo.
echo # Polling fallback interval in seconds ^(optional^)
echo SYNC_INTERVAL_SECONDS=10
) > "d:\GYM WEBSITE\biometric-agent\.env"
echo     ✅ biometric-agent\.env updated.

REM ── Step 3: Restart biometric agent with new URL ──────────────────
echo [3/4] Restarting biometric-agent in PM2...
call pm2 restart biometric-agent 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo     [WARN] PM2 restart failed — start it manually with: pm2 start biometric-agent
) else (
    echo     ✅ biometric-agent restarted.
)

REM ── Step 4: Rebuild and redeploy frontend to Vercel ───────────────
echo [4/4] Rebuilding and deploying frontend to Vercel...
cd /d "d:\GYM WEBSITE\frontend"
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo     [ERROR] npm build failed! Fix build errors and run: vercel --prod
    pause
    exit /b 1
)
call vercel --prod
if %ERRORLEVEL% NEQ 0 (
    echo     [WARN] Vercel deploy failed. Try manually: cd frontend ^&^& vercel --prod
) else (
    echo     ✅ Frontend redeployed to Vercel.
)

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║   ✅ SWITCH COMPLETE!                                ║
echo ║   Active Backend : %TARGET_URL%
echo ║   Active Account : %ACTIVE_MAIL%
echo ╚══════════════════════════════════════════════════════╝
echo.
echo  NEXT STEPS:
echo  1. Verify website loads: https://tfc365.com
echo  2. Test a fingerprint scan on the biometric machine
echo  3. Run "pm2 list" to confirm biometric-agent is online
echo.
pause
