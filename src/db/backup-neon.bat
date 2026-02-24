@echo off
REM =============================================
REM SCRIPT DE BACKUP - Neon PostgreSQL
REM Projeto: Convoca App
REM Schema: public
REM =============================================

REM Suporte a execução não-interativa
set NO_PAUSE=0
if /i "%~1"=="--no-pause" set NO_PAUSE=1

REM Adicionar PostgreSQL ao PATH (versão 18 - compatível com Neon)
set PATH=C:\Program Files\PostgreSQL\18\bin;%PATH%

REM Configurações do Neon (baseadas no .env)
set DB_HOST=ep-broad-grass-acup6c00-pooler.sa-east-1.aws.neon.tech
set DB_PORT=5432
set DB_NAME=neondb
set DB_USER=neondb_owner
set DB_SCHEMA=public
REM Salvar sempre na pasta backups da raiz do repositório
set BACKUP_DIR=%~dp0..\..\backups
set PGPASSWORD=npg_B4CgzrE5ZqQj

REM Neon exige SSL; garante que o libpq use SSL
set PGSSLMODE=require

REM Criar timestamp para o arquivo
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%

REM Criar diretório de backup se não existir
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo ========================================
echo 🔄 BACKUP DO CONVOCA APP (Neon PostgreSQL)
echo ========================================
echo 📅 Timestamp: %TIMESTAMP%
echo 🗄️  Schema: %DB_SCHEMA%
echo 🌐 Host: %DB_HOST%
echo 📁 Diretório: %BACKUP_DIR%
echo ========================================
echo.

REM 1. Backup COMPLETO (estrutura + dados)
echo 📦 [1/3] Gerando backup COMPLETO do schema public...
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -n %DB_SCHEMA% -F p -b --no-owner --no-privileges -v -f "%BACKUP_DIR%\convoca_full_%TIMESTAMP%.sql"

if %errorlevel% equ 0 (
    echo ✅ Backup completo criado: convoca_full_%TIMESTAMP%.sql
) else (
    echo ❌ ERRO ao criar backup completo!
    exit /b 1
)
echo.

REM 2. Backup APENAS ESTRUTURA (tabelas, views, functions, etc)
echo 🏗️  [2/3] Gerando backup da ESTRUTURA (schema-only)...
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -n %DB_SCHEMA% -F p -s --no-owner --no-privileges -v -f "%BACKUP_DIR%\convoca_structure_%TIMESTAMP%.sql"

if %errorlevel% equ 0 (
    echo ✅ Backup da estrutura criado: convoca_structure_%TIMESTAMP%.sql
) else (
    echo ❌ ERRO ao criar backup da estrutura!
    exit /b 1
)
echo.

REM 3. Backup APENAS DADOS (sem DDL)
echo 📊 [3/3] Gerando backup dos DADOS (data-only)...
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -n %DB_SCHEMA% -F p -a --no-owner --no-privileges -v -f "%BACKUP_DIR%\convoca_data_%TIMESTAMP%.sql"

if %errorlevel% equ 0 (
    echo ✅ Backup dos dados criado: convoca_data_%TIMESTAMP%.sql
) else (
    echo ❌ ERRO ao criar backup dos dados!
    exit /b 1
)
echo.

echo ========================================
echo 🎉 BACKUP CONCLUÍDO COM SUCESSO!
echo ========================================
echo 📁 Localização: %BACKUP_DIR%\
echo 📦 Arquivos gerados:
echo    - convoca_full_%TIMESTAMP%.sql (completo)
echo    - convoca_structure_%TIMESTAMP%.sql (estrutura)
echo    - convoca_data_%TIMESTAMP%.sql (dados)
echo ========================================
echo.
echo 💡 Para restaurar um backup:
echo    psql "postgresql://neondb_owner:npg_B4CgzrE5ZqQj@ep-broad-grass-acup6c00-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require" -f %BACKUP_DIR%\convoca_full_TIMESTAMP.sql
echo.
if "%NO_PAUSE%"=="1" exit /b 0
pause
