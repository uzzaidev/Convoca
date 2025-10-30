# Script para aplicar todas as migrations pendentes
# Uso: .\src\db\apply-migrations.ps1
#
# Este script aplica todas as migrations na pasta src/db/migrations/
# na ordem alfabética (que corresponde à ordem cronológica por timestamp)

$DB_URL = "postgresql://neondb_owner:REDACTED_PASSWORD@ep-broad-grass-acup6c00-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
$MIGRATIONS_DIR = "src\db\migrations"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔄 APLICANDO MIGRATIONS - Peladeiros App" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o diretório de migrations existe
if (-not (Test-Path $MIGRATIONS_DIR)) {
    Write-Host "❌ Diretório de migrations não encontrado: $MIGRATIONS_DIR" -ForegroundColor Red
    Write-Host "   Crie o diretório ou execute este script da raiz do projeto." -ForegroundColor Yellow
    exit 1
}

# Listar arquivos .sql ordenados por nome (timestamp)
$migrations = Get-ChildItem -Path $MIGRATIONS_DIR -Filter "*.sql" -ErrorAction SilentlyContinue | Sort-Object Name

if ($migrations.Count -eq 0) {
    Write-Host "⚠️  Nenhuma migration encontrada em $MIGRATIONS_DIR" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 Para criar uma nova migration, execute:" -ForegroundColor Cyan
    Write-Host "   .\src\db\create-migration.ps1 `"nome_da_migration`"" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

Write-Host "📋 Encontradas $($migrations.Count) migration(s):" -ForegroundColor White
Write-Host ""

foreach ($migration in $migrations) {
    Write-Host "   📄 $($migration.Name)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "⚠️  Tem certeza que deseja aplicar todas as migrations?" -ForegroundColor Yellow
Write-Host "   (Recomendado fazer backup antes: .\src\db\backup-neon.bat)" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Continuar? (s/N)"

if ($confirmation -ne "s" -and $confirmation -ne "S") {
    Write-Host ""
    Write-Host "❌ Operação cancelada pelo usuário." -ForegroundColor Red
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 Aplicando migrations..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$successCount = 0
$errorCount = 0

foreach ($migration in $migrations) {
    Write-Host "📄 Aplicando: $($migration.Name)" -ForegroundColor Green
    
    # Executar migration via psql
    psql $DB_URL -f $migration.FullName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Aplicada com sucesso" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "   ❌ ERRO ao aplicar migration!" -ForegroundColor Red
        Write-Host "   Parando execução para evitar inconsistências." -ForegroundColor Red
        $errorCount++
        break
    }
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 RESUMO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Sucesso: $successCount" -ForegroundColor Green
Write-Host "❌ Erros: $errorCount" -ForegroundColor Red
Write-Host ""

if ($errorCount -eq 0) {
    Write-Host "🎉 Todas as migrations foram aplicadas com sucesso!" -ForegroundColor Green
    Write-Host ""
    exit 0
} else {
    Write-Host "⚠️  Houve erros. Verifique os logs acima." -ForegroundColor Yellow
    Write-Host "   Se necessário, faça rollback ou restaure o backup." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
