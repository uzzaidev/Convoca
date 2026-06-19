# 03_DEPENDENCIES.md
**Checkpoint Date**: 2026-03-15 (UTC-3)
**Commit**: dad0911079482b15ff5c43e9ef73a44b4c752699
**Branch**: main

---

## Package Manager

**Evidência**: `package.json:13`
```json
"packageManager": "pnpm@10.18.1"
```

✅ **FATO**: Projeto usa pnpm versão 10.18.1 como package manager obrigatório.

---

## Node.js Version Requirement

**Evidência**: `package.json:14-16`
```json
"engines": {
  "node": ">=18.17.0"
}
```

✅ **FATO**: Requer Node.js >= 18.17.0

---

## Scripts Disponíveis

**Evidência**: `package.json:5-12`

| Script | Comando | Descrição |
|--------|---------|-----------|
| `dev` | `next dev --webpack` | Inicia servidor de desenvolvimento |
| `dev:doppler` | `doppler run -- next dev --webpack` | Dev com Doppler para secrets management |
| `build` | `next build` | Build de produção |
| `start` | `next start` | Inicia servidor de produção |
| `lint` | `next lint` | Executa ESLint |
| `backup` | `bash src/db/backup-supabase.sh` | Backup do banco de dados |

---

## Dependências de Produção (dependencies)

**Evidência**: `package.json:17-52`

### Framework Core

| Package | Versão | Propósito | Criticidade |
|---------|--------|-----------|-------------|
| `next` | `16.1.1` | Framework React (App Router) | **CRÍTICA** |
| `react` | `^19.2.0` | UI library | **CRÍTICA** |
| `react-dom` | `^19.2.0` | React DOM renderer | **CRÍTICA** |

### Database

| Package | Versão | Propósito | Criticidade |
|---------|--------|-----------|-------------|
| `postgres` | `^3.4.8` | PostgreSQL client (serverless-ready) | **CRÍTICA** |
| `@auth/pg-adapter` | `^1.7.4` | NextAuth PostgreSQL adapter | **ALTA** |

**Observação**: Projeto usa raw SQL via `postgres` package, SEM ORM (regra absoluta do projeto).

### Authentication

| Package | Versão | Propósito | Criticidade |
|---------|--------|-----------|-------------|
| `next-auth` | `^5.0.0-beta.25` | NextAuth v5 (Auth.js) | **CRÍTICA** |
| `bcryptjs` | `^2.4.3` | Password hashing | **CRÍTICA** |

**Observação**: NextAuth v5 beta - necessário monitorar releases para versão stable.

### Validation & Type Safety

| Package | Versão | Propósito | Criticidade |
|---------|--------|-----------|-------------|
| `zod` | `^3.24.1` | Schema validation | **ALTA** |

### State Management

| Package | Versão | Propósito | Criticidade |
|---------|--------|-----------|-------------|
| `zustand` | `^5.0.8` | Client-side state management | **MÉDIA** |

### UI Components (Radix UI)

| Package | Versão | Propósito | Criticidade |
|---------|--------|-----------|-------------|
| `@radix-ui/react-accordion` | `^1.2.12` | Accordion component | BAIXA |
| `@radix-ui/react-alert-dialog` | `^1.1.15` | Alert dialog | BAIXA |
| `@radix-ui/react-avatar` | `^1.1.1` | Avatar component | BAIXA |
| `@radix-ui/react-dialog` | `^1.1.15` | Dialog/modal | MÉDIA |
| `@radix-ui/react-dropdown-menu` | `^2.1.2` | Dropdown menu | MÉDIA |
| `@radix-ui/react-label` | `^2.1.0` | Form label | BAIXA |
| `@radix-ui/react-radio-group` | `^1.2.3` | Radio group | BAIXA |
| `@radix-ui/react-select` | `^2.2.6` | Select dropdown | MÉDIA |
| `@radix-ui/react-separator` | `^1.1.0` | Separator | BAIXA |
| `@radix-ui/react-slider` | `^1.3.6` | Slider component | BAIXA |
| `@radix-ui/react-slot` | `^1.1.0` | Slot utility | BAIXA |
| `@radix-ui/react-tabs` | `^1.1.1` | Tabs component | MÉDIA |
| `@radix-ui/react-toast` | `^1.2.15` | Toast notifications | MÉDIA |

### UI Utilities

| Package | Versão | Propósito | Criticidade |
|---------|--------|-----------|-------------|
| `class-variance-authority` | `^0.7.1` | CVA for component variants | MÉDIA |
| `clsx` | `^2.1.1` | ClassName utility | MÉDIA |
| `tailwind-merge` | `^2.5.5` | Tailwind class merging | MÉDIA |
| `tailwindcss-animate` | `^1.0.7` | Tailwind animations | BAIXA |
| `lucide-react` | `^0.462.0` | Icon library | MÉDIA |

### Data Tables

| Package | Versão | Propósito | Criticidade |
|---------|--------|-----------|-------------|
| `@tanstack/react-table` | `^8.21.3` | Table component (rankings, payments) | MÉDIA |

### PDF Generation

| Package | Versão | Propósito | Criticidade |
|---------|--------|-----------|-------------|
| `jspdf` | `^3.0.4` | PDF generation | BAIXA |
| `jspdf-autotable` | `^5.0.2` | PDF tables | BAIXA |

🔍 **INFERÊNCIA**: Provavelmente usado para exportação de rankings/relatórios financeiros.

### Email

| Package | Versão | Propósito | Criticidade |
|---------|--------|-----------|-------------|
| `resend` | `^6.9.3` | Email service integration | **ALTA** |

**Evidência**: Usado para password reset emails.

### Utilities

| Package | Versão | Propósito | Criticidade |
|---------|--------|-----------|-------------|
| `date-fns` | `^4.1.0` | Date manipulation | MÉDIA |

### Logging

| Package | Versão | Propósito | Criticidade |
|---------|--------|-----------|-------------|
| `pino` | `^9.5.0` | Structured logging | **ALTA** |
| `pino-pretty` | `^13.0.0` | Pretty logging for dev | BAIXA |

---

## Dependências de Desenvolvimento (devDependencies)

**Evidência**: `package.json:53-64`

| Package | Versão | Propósito |
|---------|--------|-----------|
| `@types/bcryptjs` | `^2.4.6` | TypeScript types |
| `@types/node` | `^22` | Node.js types |
| `@types/react` | `^19.2.2` | React types |
| `@types/react-dom` | `^19.2.2` | React DOM types |
| `eslint` | `^9` | Linter |
| `eslint-config-next` | `16.1.1` | Next.js ESLint config |
| `@eslint/eslintrc` | `^3.2.0` | ESLint config utility |
| `postcss` | `^8` | CSS processing |
| `tailwindcss` | `^3.4.1` | Utility-first CSS |
| `typescript` | `^5` | TypeScript compiler |

---

## Dependências Críticas para Segurança

### 🔒 High Priority

1. **next-auth** (^5.0.0-beta.25)
   - ⚠️ **BETA VERSION** - necessário monitorar para release stable
   - Autenticação de toda a aplicação depende disso
   - **Ação Recomendada**: Planejar upgrade para versão stable quando disponível

2. **bcryptjs** (^2.4.3)
   - Password hashing crítico para segurança
   - **Ação Recomendada**: Manter atualizado, verificar CVEs regularmente

3. **postgres** (^3.4.8)
   - Database client com acesso total ao banco
   - **Ação Recomendada**: Monitorar security advisories

4. **next** (16.1.1)
   - Framework core, vulnerabilidades podem afetar toda a aplicação
   - **Ação Recomendada**: Atualizar regularmente conforme releases de segurança

---

## Potenciais Updates

🔍 **INFERÊNCIA**: Baseado nas versões atuais, sugere-se verificar:

1. **next-auth**: Migrar de beta para stable quando disponível
2. **React 19**: Versão recente (19.2.0) - monitorar stability
3. **Next.js 16**: Versão recente (16.1.1) - monitorar issues

---

## Dependências Ausentes (Notáveis)

✅ **FATO**: Projeto NÃO usa:
- ❌ ORM (Prisma, Drizzle, TypeORM) - **regra absoluta do projeto**
- ❌ React Query/SWR - usa Zustand para estado
- ❌ Testing libraries - **GAP CRÍTICO**
- ❌ E2E testing (Playwright, Cypress)
- ❌ Component testing (Vitest, Jest)

💡 **Oportunidade de Melhoria**: Adicionar testing framework.

---

## Análise de Peso (Bundle Size)

🔍 **INFERÊNCIA**: Principais contribuidores para bundle size:
- Radix UI (múltiplos pacotes) - necessário para shadcn/ui
- Next.js + React 19
- TanStack Table
- jsPDF (usado apenas em alguns flows)

**Recomendação**: Considerar code splitting para jsPDF (carregar apenas quando necessário).

---

## Conclusão

✅ Stack moderno e bem definido
✅ Dependências críticas identificadas
⚠️ NextAuth v5 ainda em beta
❌ **GAP**: Ausência completa de testes
💡 Considerar adicionar testing framework (Vitest/Jest + Testing Library)
