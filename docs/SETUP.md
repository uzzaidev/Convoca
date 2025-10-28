# Setup Guide - Peladeiros App

Guia completo para configurar e fazer deploy do app de peladas.

## Pré-requisitos

- Node.js 18+ instalado
- Conta no GitHub
- Conta na Vercel
- Conta no Neon (database PostgreSQL serverless)

## 1. Instalação Local

### Instalar dependências

```bash
npm install
```

## 2. Setup do Database (Neon)

### Opção A: Via Vercel Integration (Recomendado)

1. Faça o deploy inicial do projeto na Vercel:
   ```bash
   npm install -g vercel
   vercel
   ```

2. No dashboard da Vercel, vá em **Settings > Integrations**

3. Adicione a integração **Neon Postgres**
   - Isso cria automaticamente um database no Neon
   - Configura a variável `DATABASE_URL` no Vercel
   - Sincroniza as env vars para desenvolvimento local

4. Pull das variáveis de ambiente:
   ```bash
   vercel env pull
   ```
   Isso cria um arquivo `.env.local` com `DATABASE_URL`

### Opção B: Manual

1. Crie uma conta em [neon.tech](https://neon.tech)

2. Crie um novo projeto e database

3. Copie a connection string

4. Crie um arquivo `.env.local` na raiz:
   ```env
   DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="gere-com-openssl-rand-base64-32"
   ```

## 3. Executar Migrations

Execute o schema SQL no seu database Neon:

### Via Neon Console (mais fácil)

1. Acesse o [Neon Console](https://console.neon.tech)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Copie todo o conteúdo de `src/db/schema.sql`
5. Cole e execute no SQL Editor

### Via Neon CLI (opcional)

```bash
# Instalar Neon CLI
npm install -g neonctl

# Login
neonctl auth

# Executar migrations
neonctl sql < src/db/schema.sql
```

## 4. Desenvolvimento Local

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000)

## 5. Deploy na Vercel

### Setup Inicial

```bash
vercel
```

Siga as instruções:
- Link to existing project? **No**
- Project name: **peladeiros-app**
- Directory: **./** (deixe vazio)
- Override settings? **No**

### Deploy de Produção

```bash
vercel --prod
```

## 6. Configurar Domínio (Opcional)

1. No dashboard da Vercel, vá em **Settings > Domains**
2. Adicione seu domínio personalizado
3. Configure os DNS conforme instruído

## 7. Variáveis de Ambiente

### Desenvolvimento (.env.local)

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

### Produção (Vercel)

Configure no dashboard da Vercel em **Settings > Environment Variables**:

- `DATABASE_URL` - Configurado automaticamente pela integração Neon
- `NEXTAUTH_URL` - URL do seu app (ex: https://peladeiros.vercel.app)
- `NEXTAUTH_SECRET` - Gere com `openssl rand -base64 32`

## 8. Gerar NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Copie o resultado e adicione nas variáveis de ambiente.

## 9. Verificar Setup

### Checklist

- [ ] `npm install` executado com sucesso
- [ ] Database Neon criado
- [ ] Migrations executadas (`src/db/schema.sql`)
- [ ] `.env.local` criado com `DATABASE_URL`
- [ ] `npm run dev` rodando sem erros
- [ ] Acesso ao localhost:3000 funcionando
- [ ] Deploy na Vercel bem-sucedido
- [ ] Variáveis de ambiente configuradas na Vercel

### Testar Conexão com Database

Crie um arquivo de teste:

```typescript
// test-db.ts
import { sql } from "./src/db/client";

async function test() {
  const result = await sql`SELECT NOW()`;
  console.log("Database connected:", result);
}

test();
```

Execute:
```bash
npx tsx test-db.ts
```

## Troubleshooting

### Erro: DATABASE_URL não definida

Certifique-se de que:
1. O arquivo `.env.local` existe na raiz do projeto
2. Contém a variável `DATABASE_URL="postgresql://..."`
3. Reinicie o servidor de dev (`npm run dev`)

### Erro: Migrations não executadas

Verifique:
1. Conexão com o database está funcionando
2. O schema SQL foi executado corretamente no Neon Console
3. Todas as tabelas foram criadas (use `\dt` no SQL Editor para listar)

### Erro: NextAuth

Certifique-se de que:
1. `NEXTAUTH_URL` está configurado
2. `NEXTAUTH_SECRET` foi gerado e configurado

## Próximos Passos

1. Configure provedores OAuth (Google, GitHub) no NextAuth se necessário
2. Personalize o tema e cores no `tailwind.config.ts`
3. Adicione membros ao primeiro grupo
4. Crie o primeiro evento/pelada
5. Teste o fluxo completo: RSVP → Sorteio → Registro de Gols → Avaliações

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Rodar build localmente
npm start

# Lint
npm run lint

# Deploy
vercel --prod
```

## Estrutura de Arquivos Importantes

```
/
├── src/
│   ├── app/              # Next.js App Router (pages & API routes)
│   ├── components/       # Componentes React
│   ├── db/              # Database client & schema
│   └── lib/             # Utilities & validações
├── .env.local           # Variáveis de ambiente (NÃO commitar)
├── package.json         # Dependências
└── README.md           # Documentação do projeto
```
