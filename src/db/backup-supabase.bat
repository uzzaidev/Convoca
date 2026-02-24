@echo off
REM =============================================
REM SCRIPT DE BACKUP - Supabase PostgreSQL
REM Projeto: Convoca App
REM Schema: public (auth do Supabase nao e usado - app usa NextAuth + public.users)
REM
REM COMO RODAR (no Prompt de Comando ou PowerShell):
REM   cd C:\Users\Luisf\Documents\GITHUB\peladeiros
REM   src\db\backup-supabase.bat
REM
REM Os arquivos ficam em: backups\convoca_*.sql  (ignorados pelo git)
REM =============================================

REM Suporte a execução não-interativa
set NO_PAUSE=0
if /i "%~1"=="--no-pause" set NO_PAUSE=1

REM Adicionar PostgreSQL ao PATH (via Scoop)
set PATH=C:\Users\%USERNAME%\scoop\apps\postgresql\current\bin;C:\Program Files\PostgreSQL\18\bin;C:\Program Files\PostgreSQL\17\bin;%PATH%

REM Configurações do Supabase (conexão direta, não pooler)
set DB_HOST=db.ieuqwbbysggfinatcelp.supabase.co
set DB_PORT=5432
set DB_NAME=postgres
set DB_USER=postgres
set DB_SCHEMA=public
REM Salvar sempre na pasta backups da raiz do repositório
set BACKUP_DIR=%~dp0..\..\backups
set PGPASSWORD=WJeazTMn3a6hHwmQ

REM Supabase exige SSL
set PGSSLMODE=require

REM Criar timestamp para o arquivo
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%

REM Criar diretório de backup se não existir
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo ========================================
echo BACKUP DO CONVOCA APP (Supabase)
echo ========================================
echo Timestamp: %TIMESTAMP%
echo Schema: %DB_SCHEMA%
echo Host: %DB_HOST%
echo Diretorio: %BACKUP_DIR%
echo ========================================
echo.

REM 1. Backup COMPLETO (estrutura + dados)
echo [1/3] Gerando backup COMPLETO do schema public...
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -n %DB_SCHEMA% -F p -b --no-owner --no-privileges -f "%BACKUP_DIR%\convoca_full_%TIMESTAMP%.sql"

if %errorlevel% equ 0 (
    echo OK Backup completo criado: convoca_full_%TIMESTAMP%.sql
) else (
    echo ERRO ao criar backup completo!
    exit /b 1
)
echo.

REM 2. Backup APENAS ESTRUTURA
echo [2/3] Gerando backup da ESTRUTURA (schema-only)...
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -n %DB_SCHEMA% -F p -s --no-owner --no-privileges -f "%BACKUP_DIR%\convoca_structure_%TIMESTAMP%.sql"

if %errorlevel% equ 0 (
    echo OK Backup da estrutura criado: convoca_structure_%TIMESTAMP%.sql
) else (
    echo ERRO ao criar backup da estrutura!
    exit /b 1
)
echo.

REM 3. Backup APENAS DADOS
echo [3/3] Gerando backup dos DADOS (data-only)...
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -n %DB_SCHEMA% -F p -a --no-owner --no-privileges -f "%BACKUP_DIR%\convoca_data_%TIMESTAMP%.sql"

if %errorlevel% equ 0 (
    echo OK Backup dos dados criado: convoca_data_%TIMESTAMP%.sql
) else (
    echo ERRO ao criar backup dos dados!
    exit /b 1
)
echo.

echo ========================================
echo BACKUP CONCLUIDO COM SUCESSO!
echo ========================================
echo Localizacao: %BACKUP_DIR%\
echo Arquivos gerados:
echo    - convoca_full_%TIMESTAMP%.sql (completo)
echo    - convoca_structure_%TIMESTAMP%.sql (estrutura)
echo    - convoca_data_%TIMESTAMP%.sql (dados)
echo ========================================
echo.
if "%NO_PAUSE%"=="1" exit /b 0
pause
