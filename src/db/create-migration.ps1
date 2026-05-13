# Cria um arquivo de migration novo, com template padrão.
# Uso (a partir da raiz do projeto):
#   .\src\db\create-migration.ps1 "add_verified_to_users"
#
# Depois de editar o SQL, aplique com:
#   pnpm db:migrate -- --only <nome_do_arquivo>.sql

param(
    [Parameter(Mandatory=$true)]
    [string]$Name
)

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$filename  = "${timestamp}_${Name}.sql"
$filepath  = "src\db\migrations\$filename"

$template = @"
-- ==================================================
-- Migration: $Name
-- Date: $(Get-Date -Format "yyyy-MM-dd")
-- Description: [Descreva o que essa migration faz]
-- ==================================================

BEGIN;

-- Adicione suas alterações aqui. Exemplos:
-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
-- CREATE INDEX IF NOT EXISTS idx_users_verified ON public.users(verified);
-- CREATE TABLE IF NOT EXISTS public.new_table (...);

COMMIT;

-- ==================================================
-- Rollback (executar manualmente se necessário):
--
-- BEGIN;
-- -- Comandos de rollback aqui
-- COMMIT;
-- ==================================================
"@

New-Item -Path $filepath -ItemType File -Value $template -Force | Out-Null

Write-Host ""
Write-Host "Migration criada: $filepath" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "  1. Edite o arquivo e adicione o SQL." -ForegroundColor White
Write-Host "  2. (Opcional) pnpm backup    # gera backup antes" -ForegroundColor White
Write-Host "  3. pnpm db:migrate -- --only $filename" -ForegroundColor White
Write-Host "  4. pnpm db:status            # confirma registro" -ForegroundColor White
Write-Host ""
