# Playbook — Rejeicoes comuns da Apple App Review e como resolver

> **Objetivo:** documentar os motivos de rejeicao mais frequentes da Apple App Review, com a causa raiz, a correcao e a licao para evitar em futuros apps.
>
> Extraido da publicacao do **Convoca** (2026-06). Aplica-se a qualquer app iOS.

---

## 0. Fluxo geral de correcao

```
Apple rejeita → ler mensagem no App Store Connect → identificar guideline →
corrigir → decidir se precisa novo build → resubmeter → reply (opcional)
```

**Quando precisa de novo build vs. apenas resubmeter:**

| Tipo de mudanca | Novo build? | Acao |
|---|---|---|
| App Privacy labels, textos do listing, screenshots | Nao | Editar no ASC → resubmeter mesma build |
| Codigo (nova API, fix de UI, novo botao) | **Sim** | Commit → push → CI gera build → esperar TestFlight → selecionar nova build → resubmeter |
| Remover framework/SDK nao usado | **Sim** | Rebuild necessario |

---

## 1. Guideline 5.1.2(i) — Privacy: Data Use and Sharing (Tracking)

### Mensagem da Apple
> "The app privacy information indicates the app collects data in order to track the user... However, the app does not use AppTrackingTransparency."

### Causa raiz
Ao preencher o App Privacy no App Store Connect, voce marcou que os dados sao usados para **tracking** (rastreamento). Se o app nao faz tracking, isso e um erro de preenchimento.

### Definicao de tracking (Apple)
Tracking = **cruzar dados coletados no seu app com dados de terceiros para fins de publicidade** OU **compartilhar dados com data brokers**. Se o app so usa os dados para funcionalidade propria (login, push, grupos, stats), **nao e tracking**.

### Correcao
1. App Store Connect → Privacidade do app → Editar
2. Para **cada tipo de dado** (Nome, Email, User ID, etc.):
   - Entrar → pergunta "Os dados sao usados para rastrear o usuario?" → marcar **Nao**
3. Publicar
4. Resubmeter a mesma build (nao precisa novo build)

### Reply sugerido para a Apple
```
The App Privacy labels were filled incorrectly. The app does NOT track users.
We do not link collected data with third-party data for advertising or share
data with data brokers. We have updated the App Privacy information to correctly
reflect that NO data is used for tracking purposes.
```

### Licao
Antes de submeter, revisar a pre-visualizacao do App Privacy. Se aparecer "Dados usados para rastrear voce" e o app nao tem SDKs de ads/tracking, esta errado.

---

## 2. Guideline 5.1.1(v) — Account Deletion

### Mensagem da Apple
> "The app supports account creation but does not include an option to initiate account deletion... The app requires users to send an email to complete account deletion."

### Causa raiz
A Apple **nao aceita** exclusao de conta por email (exceto industrias altamente reguladas como bancos, saude, seguros). O usuario deve conseguir excluir a conta **diretamente no app**, sem passos extras.

### O que a Apple exige
- Botao dentro do app que inicia a exclusao
- Pode ter **uma tela de confirmacao** ("Tem certeza?")
- **Nao pode** exigir: criar outra conta, ligar para suporte, mandar email, visitar site externo (exceto link direto pra pagina de exclusao)
- Desativar/suspender conta temporariamente **nao basta** — tem que ser exclusao real

### Correcao (exemplo tecnico)
1. Criar endpoint `DELETE /api/users/me`:
```typescript
export async function DELETE() {
  const user = await requireAuth();
  await sql`DELETE FROM users WHERE id = ${user.id}`;
  return NextResponse.json({ deleted: true });
}
```
2. Botao no perfil com fluxo de 2 passos:
   - Passo 1: "Excluir minha conta" (card com explicacao)
   - Passo 2: "Confirmar exclusao" + "Cancelar"
   - Apos confirmar: chama DELETE → signOut → redireciona ao login
3. FKs no banco com `ON DELETE CASCADE` cuidam das tabelas filhas

### Reply sugerido para a Apple
```
We have implemented in-app account deletion. Users can now delete their account
directly from Profile → "Excluir minha conta" → confirm → account is deleted
immediately. No email is required.
```

### Licao
Implementar exclusao in-app **ANTES** da primeira submissao. Checklist pre-submit:
- [ ] Endpoint DELETE que apaga o user do banco
- [ ] Botao no perfil com confirmacao (max 2 cliques)
- [ ] signOut apos exclusao
- [ ] Testar o fluxo completo (criar conta → excluir → tentar logar = falha)

---

## 3. Guideline 2.1 — App Completeness (crash ou tela em branco)

### Causa comum em apps Capacitor (WebView)
O app carrega uma URL ao vivo (`server.url`). Se o site estiver fora do ar, retornar 307 (redirect pra login), ou o certificado SSL expirar, o app mostra tela em branco ou crash.

### Prevencao
- Garantir que a URL de producao responde HTTP 200
- Paginas publicas (privacidade, termos, produto) devem estar no `PUBLIC_PATHS` do middleware/proxy para nao cair no redirect de autenticacao
- Testar no device/emulador antes de submeter (nao so no browser)

---

## 4. Guideline 4.0 — Design (iPad screenshots)

### Mensagem da Apple
> "Screenshots are required for iPad 13-inch."

### Causa raiz
Se o app roda em iPad (Capacitor por padrao suporta iPad), a Apple exige screenshots de iPad **mesmo que o app nao seja otimizado para tablet**.

### Correcao
Gerar screenshots de iPad 13" com puppeteer-core (ver playbook `app-screenshots-headless`):
- Viewport: 1024x1366 @ 2x = **2048x2732**
- User-agent de iPad

Alternativa: marcar o app como "somente iPhone" no App Store Connect → Info → nao requer novo build, mas pode limitar audiencia.

---

## 5. Guideline 4 — Design: layout cortado no iPad

### Mensagem da Apple
> "Parts of the app's user interface were crowded, laid out, or displayed in a way that made it difficult to use the app when reviewed on iPad."

### Causa comum em apps Capacitor (WebView)
O sidebar fixo com `h-screen` nao respeita os safe area insets do iPadOS. Botoes na parte inferior do sidebar (como "Sair" / logout) ficam cortados ou inacessiveis.

### Correcao
1. Adicionar `viewport-fit=cover` no meta viewport (Next.js: `viewportFit: "cover"` no export `viewport`)
2. No bloco inferior do sidebar, adicionar: `padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px))`
3. Garantir que o container flex tem `min-h-0` e que blocos fixos tem `shrink-0`
4. Testar o layout em iPad (Safari DevTools ou device real via TestFlight)

### Licao
Apps Capacitor por padrao rodam em iPad. **Sempre testar layout em resolucao de iPad** (1024x1366) antes de submeter. A Apple testa em iPads reais (Air, Pro) e elementos cortados sao rejeicao automatica.

---

## 6. Guideline 2.1(b) — Information Needed: modelo de negocio

### Mensagem da Apple
> "It appears the app may access or include paid digital content or services, and we want to understand your business model."

### Quando acontece
Apps com funcionalidades de "pagamento", "cobranca", "carteira", "assinatura" — mesmo que nao processem pagamentos reais — disparam essa revisao. A Apple quer saber se deveria usar IAP.

### Quando IAP NAO e necessario
- App registra pagamentos feitos fora do app (PIX, dinheiro, transferencia) — so controle/registro
- Pagamentos sao para servicos fisicos (aluguel de quadra, coletes, bola)
- Modelo B2B/group-management (App Review Guidelines 3.1.3(e) e (f))
- Nao ha conteudo digital desbloqueavel, assinatura premium ou moeda virtual

### Reply sugerido para a Apple
```
Thank you for your questions. Here are the answers:

1. Users are organizers and members of amateur sports groups (soccer/futsal).

2. The app does NOT process any payments. The "charges" feature is a bookkeeping
   tool that helps group organizers track who has paid for real-world expenses
   (field rental, equipment). Actual payments happen outside the app via bank
   transfer (PIX), cash, or other offline methods.

3. There is no previously purchased content, subscriptions, or premium features.
   All app features are available to all users equally.

4. No paid content, subscriptions, or features are unlocked within the app.
   The app does not process payments and does not use any payment gateway.
   The financial feature is purely a record-keeping/bookkeeping tool for
   tracking group expense contributions.

This falls under App Review Guidelines 3.1.3(e) — goods and services consumed
outside the app (physical sports facility rentals, equipment).
```

### Licao
Se o app tem qualquer tela de "pagamento" ou "cobranca", incluir nos **Review Notes** uma nota explicando que nao ha compra digital. Exemplo: "The financial section is a bookkeeping tool for tracking offline payments (field rental). No real payments are processed in-app."

---

## 7. Checklist pre-submissao (evitar rejeicoes comuns)

Antes de clicar "Submit for Review", verificar:

- [ ] **Account deletion** funciona in-app (botao no perfil, sem email)
- [ ] **App Privacy** preenchido com tracking = Nao (se nao usa ads/analytics de terceiros)
- [ ] **Screenshots** de iPhone E iPad enviados
- [ ] **Privacy Policy URL** retorna HTTP 200 sem redirect
- [ ] **Conta demo** populada com dados reais (grupo, membros, evento)
- [ ] **Review Notes** explicam o que o reviewer vai ver ao logar
- [ ] **Review Notes** explicam modelo de negocio se ha telas de pagamento/cobranca
- [ ] **Build testada** no device real via TestFlight (nao so simulador)
- [ ] **Layout testado em iPad** (resolucao 1024x1366, verificar safe areas)
- [ ] **Paginas publicas** nao redirecionam pra login (testar `/privacidade`, `/termos`, `/suporte` em aba anonima)
- [ ] **Copyright** preenchido (ex: "© 2026 Uzz.Ai Ltda")
- [ ] **Content Rating** respondido (geralmente 4+ para apps sem conteudo objetavel)

---

## 8. Comunicacao com a Apple

- Responda **sempre em ingles** na thread do App Store Connect
- Seja direto: "We fixed X. The new build Y includes the fix."
- Se discordar da rejeicao, use "Reply" e explique — a Apple aceita contestacoes educadas
- Tempo medio de revisao: 1-3 dias (conta nova pode demorar mais na primeira vez)
- Se urgente: agende um **App Review Appointment** (terca/quinta, horario local)

---

## TL;DR

```
Rejeicao mais comum #1: App Privacy com tracking = Sim (quando nao tem)
  → Fix: editar labels no ASC, mesma build

Rejeicao mais comum #2: Exclusao de conta por email
  → Fix: implementar DELETE + botao no perfil, novo build

Rejeicao mais comum #3: Falta screenshot de iPad
  → Fix: gerar com puppeteer 2048x2732, mesma build

Rejeicao mais comum #4: Layout cortado no iPad (safe areas)
  → Fix: viewport-fit=cover + env(safe-area-inset-*), novo build

Rejeicao mais comum #5: Apple pergunta sobre modelo de negocio (2.1b)
  → Fix: reply explicando que nao ha compra digital, mesma build

Regra de ouro: tudo que e so no ASC = mesma build
              tudo que e codigo = novo build via CI
```
