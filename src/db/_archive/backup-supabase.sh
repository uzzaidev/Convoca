#!/usr/bin/env bash
# =============================================
# SCRIPT DE BACKUP - Supabase PostgreSQL
# Projeto: Convoca App
# Schema: public (auth do Supabase não é usado — app usa NextAuth + public.users)
#
# COMO RODAR (no terminal do VS Code ou Git Bash):
#   cd C:\Users\Luisf\Documents\GITHUB\peladeiros
#   bash src/db/backup-supabase.sh
#
# Ou pelo npm:
#   pnpm backup
#
# Os arquivos ficam em: backups/convoca_*.sql  (ignorados pelo git)
# =============================================

set -e

DB_HOST="db.ieuqwbbysggfinatcelp.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"
DB_SCHEMA="public"
BACKUP_DIR="$(dirname "$0")/../../backups"
export PGPASSWORD="WJeazTMn3a6hHwmQ"
export PGSSLMODE="require"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

echo "========================================"
echo "BACKUP DO CONVOCA APP (Supabase)"
echo "========================================"
echo "Timestamp : $TIMESTAMP"
echo "Host      : $DB_HOST"
echo "Schema    : $DB_SCHEMA"
echo "Destino   : $BACKUP_DIR"
echo "========================================"
echo ""

echo "[1/3] Backup COMPLETO (estrutura + dados)..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -n "$DB_SCHEMA" -F p -b --no-owner --no-privileges \
  -f "$BACKUP_DIR/convoca_full_${TIMESTAMP}.sql"
echo "OK: convoca_full_${TIMESTAMP}.sql"
echo ""

echo "[2/3] Backup ESTRUTURA (schema-only)..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -n "$DB_SCHEMA" -F p -s --no-owner --no-privileges \
  -f "$BACKUP_DIR/convoca_structure_${TIMESTAMP}.sql"
echo "OK: convoca_structure_${TIMESTAMP}.sql"
echo ""

echo "[3/3] Backup DADOS (data-only)..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -n "$DB_SCHEMA" -F p -a --no-owner --no-privileges \
  -f "$BACKUP_DIR/convoca_data_${TIMESTAMP}.sql"
echo "OK: convoca_data_${TIMESTAMP}.sql"
echo ""

echo "========================================"
echo "BACKUP CONCLUIDO: $BACKUP_DIR"
echo "  convoca_full_${TIMESTAMP}.sql"
echo "  convoca_structure_${TIMESTAMP}.sql"
echo "  convoca_data_${TIMESTAMP}.sql"
echo "========================================"
