# Como restaurar os backups no Supabase (PostgreSQL)

Este diretório contém dumps `.sql` gerados via `pg_dump` a partir do banco Neon (Convoca).

## Arquivos gerados

Para cada backup, existem 3 variações:

- `peladeiros_full_YYYYMMDD_HHMMSS.sql` → **estrutura + dados** (tudo)
- `peladeiros_structure_YYYYMMDD_HHMMSS.sql` → **apenas estrutura** (DDL)
- `peladeiros_data_YYYYMMDD_HHMMSS.sql` → **apenas dados** (INSERT/COPY)

## Importante: não use o “SQL Editor” do Supabase nesses dumps

Esses arquivos `.sql` do `pg_dump` em formato “plain” incluem comandos específicos do `psql` (ex.: `\restrict`, `\connect`, etc.).

- ✅ Funciona com: `psql` (CLI) / pgAdmin / ferramentas que executam scripts via libpq
- ❌ Não funciona no: Supabase SQL Editor (web)

## Sobre “auth” do app

No Convoca, a autenticação do app (login/senha) **não usa o Supabase Auth**.

- O login do app é via **NextAuth (Credentials)**.
- Os usuários ficam na tabela `public.users` (campos como `email`, `password_hash`).

Ou seja: restaurando o schema `public` + dados, você leva junto “auth do app” e os dados do app.

## Pré-requisitos

1) Ter `psql` instalado na máquina

- Se você já tem PostgreSQL instalado, normalmente o `psql` já vem junto.

2) Ter a connection string do Supabase (modo banco)

- No Supabase: Project Settings → Database → Connection string
- Use a string no formato `postgresql://...`

## Restore recomendado (2 etapas: estrutura → dados)

Esse fluxo costuma ser o mais previsível no Supabase.

### 1) Restaurar a estrutura

No PowerShell (Windows), na raiz do repo:

```powershell
$env:SUPABASE_DB_URL = "postgresql://USER:PASSWORD@HOST:PORT/postgres?sslmode=require"
psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "backups\peladeiros_structure_YYYYMMDD_HHMMSS.sql"
```

### 2) Restaurar os dados

```powershell
$env:SUPABASE_DB_URL = "postgresql://USER:PASSWORD@HOST:PORT/postgres?sslmode=require"
psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "backups\peladeiros_data_YYYYMMDD_HHMMSS.sql"
```

## Restore alternativo (1 etapa: full)

Se você quer aplicar tudo de uma vez:

```powershell
$env:SUPABASE_DB_URL = "postgresql://USER:PASSWORD@HOST:PORT/postgres?sslmode=require"
psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "backups\peladeiros_full_YYYYMMDD_HHMMSS.sql"
```

## Dicas e problemas comuns

### Já existe schema/tabelas no Supabase

- Se o banco já tiver tabelas com os mesmos nomes, o restore pode falhar por conflito.
- O caminho “limpo” é restaurar em um projeto Supabase novo, ou dropar as tabelas antes.

### Parar no primeiro erro

- `-v ON_ERROR_STOP=1` faz o `psql` abortar no primeiro erro (melhor para diagnosticar).

### Conferir se conectou

```powershell
psql "$env:SUPABASE_DB_URL" -c "select now();"
```

## Como gerar novos backups (Neon)

Na raiz do projeto:

```powershell
cmd /c "src\db\backup-neon.bat --no-pause"
```

Isso cria (ou atualiza) os 3 arquivos em `backups/`.
