@echo off
cd /d "%~dp0"
node -v >nul 2>&1
if %errorlevel% neq 0 (
  echo Node.jsがインストールされていません
  start https://nodejs.org/ja/
  pause
  exit
)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3003"') do taskkill /f /pid %%a >nul 2>&1
timeout /t 1 >nul
start http://localhost:3003
node server.js
pause
