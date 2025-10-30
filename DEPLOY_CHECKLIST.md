# 🚀 Checklist de Deploy - Link de Participação

## ✅ O Que Foi Implementado

Esta PR adiciona:
- ✅ Página de confirmação com link direto (`/events/[eventId]`)
- ✅ Seleção de posições (1ª e 2ª opção)
- ✅ Salvamento de posições no banco de dados
- ✅ Interface responsiva e intuitiva
- ✅ Documentação completa

---

## 📝 Passos para Deploy

### 1. Review e Merge ✋

**Antes de fazer merge, revisar:**

- [ ] Ler `PR_SUMMARY.md` para entender as mudanças
- [ ] Ler `docs/FEATURE_LINK_PARTICIPACAO.md` para detalhes técnicos
- [ ] Revisar `docs/VISUAL_DEMO.md` para ver como ficou a UI
- [ ] Verificar que o build está passando (✅ já verificado)
- [ ] Fazer code review dos arquivos modificados

**Arquivos principais para revisar:**
```
src/app/events/[eventId]/page.tsx              (nova página)
src/components/events/event-rsvp-form.tsx      (novo componente)
src/app/api/events/[eventId]/rsvp/route.ts     (modificado)
src/lib/validations.ts                          (modificado)
```

### 2. Fazer Merge 🔀

```bash
# Via GitHub UI ou:
git checkout main
git merge copilot/add-participation-link-features
git push origin main
```

### 3. Aplicar Migração SQL 🗄️

**IMPORTANTE**: Faça isso ANTES do deploy do código para produção!

#### Opção A: Via Neon Console (Recomendado)

1. Acesse https://console.neon.tech/
2. Selecione seu projeto
3. Vá para **SQL Editor**
4. Copie e cole o conteúdo de `src/db/migrations/001_add_position_preferences.sql`
5. Execute (Run Query)
6. Verifique sucesso (veja seção "Verificação" abaixo)

#### Opção B: Via CLI

```bash
# Se tiver o psql instalado:
psql $DATABASE_URL -f src/db/migrations/001_add_position_preferences.sql
```

#### Opção C: Via Script Node.js

```javascript
import { sql } from "@/db/client";
import fs from "fs";

const migration = fs.readFileSync(
  "./src/db/migrations/001_add_position_preferences.sql",
  "utf-8"
);

await sql.unsafe(migration);
console.log("✅ Migration applied successfully!");
```

### 4. Verificar Migração ✔️

Execute no SQL Editor do Neon:

```sql
-- Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'event_attendance' 
  AND column_name IN ('preferred_position', 'secondary_position');
```

**Resultado esperado:**
```
      column_name      | data_type         | is_nullable
-----------------------+-------------------+-------------
 preferred_position    | character varying | YES
 secondary_position    | character varying | YES
```

Se você vir essas 2 linhas, a migração foi aplicada com sucesso! ✅

### 5. Deploy para Produção 🌐

**Se estiver usando Vercel** (provavelmente sim):

A. Via UI:
1. Acesse https://vercel.com/
2. Selecione o projeto
3. Vá para **Deployments**
4. Clique em **Redeploy** no último deploy
5. Aguarde build e deploy

B. Via Push (automático):
```bash
git push origin main
# Vercel faz deploy automático
```

### 6. Testes em Produção 🧪

Após o deploy, teste os seguintes cenários:

#### Teste 1: Acesso à página
- [ ] Vá para o dashboard
- [ ] Clique em um evento no card "Próximas Peladas"
- [ ] Deve abrir `/events/[eventId]`
- [ ] Página carrega sem erros

#### Teste 2: Seleção de posições
- [ ] Selecione uma 1ª posição (ex: Atacante)
- [ ] A posição deve ficar destacada (borda azul)
- [ ] Selecione uma 2ª posição diferente
- [ ] Ambas devem estar destacadas

#### Teste 3: Confirmação
- [ ] Clique em "Confirmar Presença"
- [ ] Toast de sucesso deve aparecer
- [ ] Página deve atualizar
- [ ] Seu nome deve aparecer na lista de confirmados
- [ ] Suas posições devem estar visíveis

#### Teste 4: Lista de espera (se evento estiver lotado)
- [ ] Com evento lotado, tente confirmar
- [ ] Deve ir para lista de espera
- [ ] Badge de "Lista de espera" deve aparecer

#### Teste 5: Responsividade
- [ ] Abra no celular ou redimensione o navegador
- [ ] Grid de posições deve ter 2 colunas no mobile
- [ ] Tudo deve estar clicável e legível

### 7. Monitoramento Inicial 📊

Primeiros dias após deploy:

- [ ] **Dia 1**: Verificar se há erros no Vercel logs
- [ ] **Dia 2**: Verificar se usuários estão usando o recurso
- [ ] **Dia 3**: Coletar feedback inicial
- [ ] **Semana 1**: Revisar métricas de uso

**Queries úteis para monitoramento:**

```sql
-- Ver quantos usuários estão usando posições
SELECT COUNT(*) 
FROM event_attendance 
WHERE preferred_position IS NOT NULL;

-- Ver distribuição de posições mais escolhidas
SELECT 
  preferred_position, 
  COUNT(*) as count
FROM event_attendance 
WHERE preferred_position IS NOT NULL
GROUP BY preferred_position
ORDER BY count DESC;

-- Ver eventos com maior engajamento
SELECT 
  e.id,
  COUNT(ea.id) as total_rsvps,
  COUNT(CASE WHEN ea.preferred_position IS NOT NULL THEN 1 END) as with_positions
FROM events e
LEFT JOIN event_attendance ea ON e.id = ea.event_id
GROUP BY e.id
ORDER BY total_rsvps DESC
LIMIT 10;
```

### 8. Comunicação aos Usuários 📢

Sugestão de mensagem para enviar aos grupos:

```
🎉 Nova Funcionalidade!

Agora você pode confirmar presença nos jogos selecionando 
suas posições preferenciais!

Como usar:
1. Clique no jogo em "Próximas Peladas"
2. Escolha sua posição favorita (Goleiro, Zagueiro, Meio ou Atacante)
3. (Opcional) Escolha uma 2ª posição
4. Confirme presença!

Isso vai ajudar a fazer times mais balanceados no futuro! ⚽
```

---

## 🔧 Troubleshooting

### Problema: "Página 404 ao acessar /events/[eventId]"

**Causa**: Deploy não atualizou corretamente

**Solução**:
```bash
# Limpar cache do Vercel
1. Ir para Vercel Dashboard
2. Settings > General
3. Rolar até "Build & Development Settings"
4. Clicar em "Clear Build Cache"
5. Fazer novo deploy
```

### Problema: "Posições não aparecem na lista de confirmados"

**Causa**: Migração não foi aplicada

**Solução**:
1. Verificar se a migração foi aplicada (ver seção 4 acima)
2. Se não foi, aplicar agora
3. Fazer novo deploy

### Problema: "Erro ao confirmar presença"

**Causa provável**: API não está recebendo os campos novos

**Debug**:
```bash
# Ver logs da API no Vercel
1. Vercel Dashboard > Deployments
2. Clicar no último deployment
3. Ir para "Runtime Logs"
4. Procurar por erros de validação
```

**Solução**:
- Verificar se `src/lib/validations.ts` foi deployado corretamente
- Verificar se `src/app/api/events/[eventId]/rsvp/route.ts` foi deployado

### Problema: "Build falha no deploy"

**Causa**: Erro de TypeScript ou dependências

**Solução**:
```bash
# Local
npm run build

# Se passar local mas falhar no Vercel:
1. Limpar node_modules e package-lock.json
2. npm install
3. Commit e push
```

---

## 📋 Checklist Completo

**Antes do Deploy:**
- [ ] Code review completo
- [ ] Build passa localmente
- [ ] Merge para main

**Durante Deploy:**
- [ ] Aplicar migração SQL
- [ ] Verificar migração aplicada
- [ ] Deploy para produção
- [ ] Build passa na Vercel

**Pós Deploy:**
- [ ] Teste 1: Acesso à página ✓
- [ ] Teste 2: Seleção de posições ✓
- [ ] Teste 3: Confirmação ✓
- [ ] Teste 4: Lista de espera ✓
- [ ] Teste 5: Responsividade ✓
- [ ] Monitorar logs por 24h
- [ ] Comunicar usuários

---

## 📞 Suporte

**Documentação**:
- `PR_SUMMARY.md` - Visão geral da PR
- `docs/FEATURE_LINK_PARTICIPACAO.md` - Feature completo
- `docs/VISUAL_DEMO.md` - Demo visual
- `docs/CAMPO_VISUAL_FUTURO.md` - Próximas fases
- `src/db/migrations/README.md` - Guia de migração

**Em caso de problemas**:
1. Verificar logs da Vercel
2. Verificar que a migração foi aplicada
3. Testar localmente primeiro
4. Consultar seção de Troubleshooting acima

---

## ✅ Critérios de Sucesso

A implementação será considerada bem-sucedida quando:

- [ ] ✅ Página `/events/[eventId]` acessível
- [ ] ✅ Usuários conseguem selecionar posições
- [ ] ✅ Confirmações são salvas com posições
- [ ] ✅ Não há erros de produção
- [ ] ✅ Usuários estão usando o recurso
- [ ] ✅ Feedback inicial é positivo

---

**Data de Criação**: 2025-10-30  
**Versão**: 1.0.0  
**Status**: ✅ Pronto para deploy

**Boa sorte com o deploy! 🚀**
