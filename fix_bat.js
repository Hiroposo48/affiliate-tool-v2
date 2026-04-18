const fs = require('fs');
const content = [
  '@echo off',
  'chcp 65001 >nul',
  'cd /d "%~dp0"',
  'node -v >nul 2>&1',
  'if %errorlevel% neq 0 (',
  '  echo Node.jsがインストールされていません',
  '  echo https://nodejs.org/ja/ からインストールしてください',
  '  start https://nodejs.org/ja/',
  '  pause',
  '  exit',
  ')',
  'for /f "tokens=5" %%a in (\'netstat -aon ^| find ":3003"\') do taskkill /f /pid %%a >nul 2>&1',
  'timeout /t 1 >nul',
  'start http://localhost:3003',
  'node server.js',
  'pause'
].join('\r\n');
fs.writeFileSync('start_win.bat', content, { encoding: 'utf8' });
console.log('完了');
