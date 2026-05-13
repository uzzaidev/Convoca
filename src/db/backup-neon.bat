@echo off
REM Wrapper para o script Node de backup (le .env.local automaticamente).
REM Equivalente a: pnpm backup
cd /d "%~dp0..\.."
node scripts\backup-neon.mjs %*
