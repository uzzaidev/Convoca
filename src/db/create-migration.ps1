# Script para criar nova migration
# Uso: .\src\db\create-migration.ps1 "nome_da_migration"

param(
    [Parameter(Mandatory=$true)]
    [string]$Name
)

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$filename = "${timestamp}_${Name}.sql"
$filepath = "src\db\migrations\$filename"

# Template de migration
$template = @"
-- ==================================================
-- Migration: $Name
-- Date: $(Get-Date -Format "yyyy-MM-dd")
-- Description: [Descreva o que essa migration faz]
-- ==================================================

BEGIN;

-- Adicione suas alterações aqui
-- Exemplos:
-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
-- CREATE INDEX IF NOT EXISTS idx_users_verified ON public.users(verified);
-- CREATE TABLE IF NOT EXISTS public.new_table (...);


COMMIT;

-- ==================================================
-- Rollback (executar manualmente se necessário):
-- 
-- BEGIN;
-- -- Comandos de rollback aqui (reverter as mudanças acima)
-- COMMIT;
-- ==================================================
"@

# Criar arquivo
New-Item -Path $filepath -ItemType File -Value $template -Force | Out-Null

Write-Host ""
Write-Host "✅ Migration criada com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📄 Arquivo: $filepath" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Edite o arquivo e adicione suas alterações SQL" -ForegroundColor White
Write-Host "   2. Faça backup antes de aplicar: .\src\db\backup-neon.bat" -ForegroundColor White
Write-Host "   3. Aplique a migration:" -ForegroundColor White
Write-Host "      psql `"postgresql://neondb_owner:REDACTED_PASSWORD@ep-broad-grass-acup6c00-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require`" -f `"$filepath`"" -ForegroundColor Gray
Write-Host ""
