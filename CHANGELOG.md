# Changelog

Gerado automaticamente por IA a cada push no `main`.

## 2026-03-25

### fix
- Reduzido o valor de `MAX_DIFF_CHARS` para 16.000 para evitar ultrapassar limites de tokens ao gerar o changelog
  - Arquivos: `.github/scripts/generate-changelog.mjs`
  - Evidência: alteração direta na constante `MAX_DIFF_CHARS`
  - Confiança: alta

## 2026-03-20

### feat
- Implementada geração automática de changelog via IA no push para branch main
  - Arquivos: `.github/scripts/generate-changelog.mjs`, `.github/workflows/ai-changelog.yml`, `.github/changelog-instructions.md`, `CHANGELOG.md`
  - Confiança: alta
