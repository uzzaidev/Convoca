# Changelog

Gerado automaticamente por IA a cada push no `main`.

## 2026-04-01

### feat
- Adicionados arquivos de contexto e sumário para os domínios de arquitetura, fatos e segurança, incluindo detalhes sobre arquitetura de banco de dados, fluxo de autenticação, portabilidade e riscos operacionais.
  - Arquivos: `.brv/context-tree/_index.md`, `.brv/context-tree/architecture/_index.md`, `.brv/context-tree/facts/_index.md`, `.brv/context-tree/security/_index.md`
  - Confiança: alta

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
