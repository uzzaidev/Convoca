# Guia: Integração Vercel + Neon

Este guia explica como configurar a integração entre Vercel e Neon para o Peladeiros App.

> **⚠️ IMPORTANTE**: Este projeto agora usa `vercel.json` vazio para permitir auto-detecção do Next.js.
> Se você está enfrentando erros 404 no Vercel, consulte [VERCEL_FIX.md](./VERCEL_FIX.md) para mais detalhes.

## Por que usar a Integração?

A integração Vercel-Neon automatiza:
- ✅ Criação do database PostgreSQL no Neon
- ✅ Configuração da variável `DATABASE_URL` na Vercel
- ✅ Sincronização de env vars entre Vercel e desenvolvimento local
- ✅ Gerenciamento de múltiplos ambientes (development, preview, production)

## Passo a Passo

### 1. Deploy Inicial na Vercel

Primeiro, faça o deploy do projeto na Vercel:

```bash
# Instalar Vercel CLI
npm install -g vercel

# Fazer login
vercel login

# Deploy inicial
vercel
```

Responda as perguntas:
- **Set up and deploy?** → Yes
- **Which scope?** → Sua conta pessoal
- **Link to existing project?** → No
- **Project name?** → peladeiros-app (ou o nome que preferir)
- **In which directory?** → ./ (deixe vazio, pressione Enter)
- **Want to override settings?** → No

Aguarde o deploy. No final você receberá uma URL de preview.

### 2. Adicionar Integração Neon

1. Acesse o [Dashboard da Vercel](https://vercel.com/dashboard)

2. Selecione seu projeto **peladeiros-app**

3. Vá em **Settings** (ícone de engrenagem)

4. No menu lateral, clique em **Integrations**

5. Procure por **"Neon"** ou acesse: https://vercel.com/integrations/neon

6. Clique em **Add Integration**

7. Selecione em qual **Scope** instalar (sua conta)

8. Escolha o projeto **peladeiros-app**

9. Configure a integração:
   - **Neon Project**: Escolha "Create new project" ou use um existente
   - **Region**: Escolha a região mais próxima (ex: US East)
   - **Database Name**: `peladeiros_db` (ou deixe o padrão)

10. Clique em **Continue** e depois em **Add Integration**

### 3. Verificar Variáveis de Ambiente

Após a integração, verifique se a variável foi criada:

1. No projeto Vercel, vá em **Settings > Environment Variables**

2. Você deve ver:
   - `DATABASE_URL` - Criada automaticamente pela integração Neon
   - Disponível em todos os ambientes: Production, Preview, Development

3. A variável terá um formato como:
   ```
   postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/peladeiros_db?sslmode=require
   ```

### 4. Pull das Variáveis para Desenvolvimento Local

Para usar as mesmas variáveis localmente:

```bash
# Na raiz do projeto
vercel env pull
```

Isso cria um arquivo `.env.local` com:
```env
DATABASE_URL="postgresql://..."
```

**IMPORTANTE:** O arquivo `.env.local` está no `.gitignore` e NÃO deve ser commitado.

### 5. Executar Migrations no Neon

Agora que o database está criado, execute as migrations:

**Opção 1: Via Neon Console (Recomendado)**

1. Acesse [Neon Console](https://console.neon.tech)

2. Faça login (use a mesma conta que conectou com Vercel)

3. Selecione o projeto que foi criado pela integração

4. Clique em **SQL Editor**

5. Copie **TODO** o conteúdo do arquivo `src/db/schema.sql`

6. Cole no SQL Editor e clique em **Run**

7. Verifique se todas as tabelas foram criadas:
   ```sql
   SELECT tablename FROM pg_tables WHERE schemaname = 'public';
   ```

**Opção 2: Via Neon CLI**

```bash
# Instalar Neon CLI
npm install -g neonctl

# Login
neonctl auth

# Listar projetos
neonctl projects list

# Executar migrations
neonctl sql < src/db/schema.sql --project-id <seu-project-id>
```

### 6. Testar Conexão

Crie um arquivo de teste na raiz:

```typescript
// test-connection.ts
import { sql } from "./src/db/client";

async function testConnection() {
  try {
    console.log("Testando conexão com Neon...");

    const result = await sql`SELECT NOW() as current_time`;
    console.log("✅ Conexão bem-sucedida!");
    console.log("Horário do servidor:", result[0].current_time);

    const tables = await sql`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    console.log("\n📋 Tabelas criadas:");
    tables.forEach((t: any) => console.log(`  - ${t.tablename}`));

  } catch (error) {
    console.error("❌ Erro na conexão:", error);
  }
}

testConnection();
```

Execute:
```bash
npx tsx test-connection.ts
```

Você deve ver:
```
Testando conexão com Neon...
✅ Conexão bem-sucedida!
Horário do servidor: 2025-01-15T10:30:00.000Z

📋 Tabelas criadas:
  - charges
  - event_actions
  - event_attendance
  - events
  - group_members
  - groups
  - invites
  - player_ratings
  - team_members
  - teams
  - transactions
  - users
  - venues
  - wallets
```

### 7. Adicionar Variáveis Adicionais

Além da `DATABASE_URL`, adicione:

1. No Vercel Dashboard → **Settings > Environment Variables**

2. Adicione:

   **NEXTAUTH_URL**
   - Value: `https://seu-dominio.vercel.app` (ou seu domínio customizado)
   - Environments: Production, Preview

   **NEXTAUTH_SECRET**
   - Gere com: `openssl rand -base64 32`
   - Value: cole o resultado
   - Environments: Production, Preview, Development

3. Faça **pull** novamente:
   ```bash
   vercel env pull
   ```

### 8. Redeploy

Após configurar as env vars, faça um novo deploy:

```bash
vercel --prod
```

## Gerenciando Múltiplos Ambientes

A integração Neon cria databases separados para:

- **Production** - Database de produção (dados reais)
- **Preview** - Database para cada PR/branch (para testes)
- **Development** - Database local ou compartilhado para dev

Para usar databases diferentes:

1. No Neon Console, crie branches adicionais do database

2. Na Vercel, configure `DATABASE_URL` diferentes para cada ambiente:
   - Production: `postgresql://...prod...`
   - Preview: `postgresql://...preview...`

## Monitoramento

### Neon Console

- **Metrics**: CPU, RAM, Storage usage
- **Query Stats**: Queries mais lentas
- **Logs**: Logs de conexão e queries

### Vercel

- **Analytics**: Performance das API Routes
- **Logs**: Runtime logs e erros
- **Monitoring**: Uptime e latência

## Troubleshooting

### Erro: "DATABASE_URL is not defined"

**Solução:**
1. Verifique se a integração foi adicionada corretamente
2. Execute `vercel env pull` novamente
3. Reinicie o servidor dev

### Erro: "Connection refused" ou "timeout"

**Solução:**
1. Verifique se o database no Neon está "Active" (não em sleep)
2. Neon pode pausar databases inativos após 5 min - a primeira query pode levar alguns segundos
3. Verifique se a connection string tem `?sslmode=require`

### Migrations não executadas

**Solução:**
1. Acesse o Neon Console
2. Vá em SQL Editor
3. Execute `\dt` para listar tabelas
4. Se vazio, execute o `schema.sql` completo novamente

### Preview deployments usando database de produção

**Solução:**
1. Na Vercel, vá em Settings > Environment Variables
2. Edite `DATABASE_URL`
3. Desmarque "Production" e deixe apenas "Preview" e "Development"
4. Crie uma nova variável `DATABASE_URL` específica para Production

## Limites do Plano Free (Neon)

- ✅ **Storage**: 0.5 GB
- ✅ **Compute**: 191.9 horas/mês
- ✅ **Branches**: 10 (perfeito para preview deployments)
- ✅ **Auto-pause**: Database pausa após 5 min de inatividade (economiza recursos)

Para projetos pequenos/médios, o plano free é mais que suficiente!

## Próximos Passos

1. ✅ Integração configurada
2. ✅ Migrations executadas
3. ⬜ Adicionar primeiro usuário via seed script (opcional)
4. ⬜ Testar fluxo completo da aplicação
5. ⬜ Configurar domínio customizado
6. ⬜ Configurar monitoring e alerts

## Links Úteis

- [Neon Console](https://console.neon.tech)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Neon Docs](https://neon.tech/docs)
- [Vercel Integration Docs](https://vercel.com/docs/integrations)
