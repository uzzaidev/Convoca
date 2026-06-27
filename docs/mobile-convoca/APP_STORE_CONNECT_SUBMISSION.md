# App Store Connect — Material para Submissão do Convoca

Preparado em: 2026-06-23. Copie/cole direto no App Store Connect.

---

## 1. App Information (Informações do App)

| Campo | Valor |
|-------|-------|
| **Name** | `Convoca` |
| **Subtitle** | `Organize sua pelada` |
| **Bundle ID** | `com.uzzai.convoca` |
| **SKU** | `convoca-001` |
| **Primary Language** | Português (Brasil) |
| **Category** | Sports (Esportes) |
| **Secondary Category** | Social Networking (opcional) |
| **Content Rights** | Does not contain third-party content |
| **Age Rating** | 4+ (sem conteúdo objetável) |

---

## 2. Pricing & Availability

| Campo | Valor |
|-------|-------|
| **Price** | Free (Grátis) |
| **Availability** | All territories (ou só Brasil, a critério) |

---

## 3. App Store Listing (Ficha da Loja) — pt-BR

### Nome
```
Convoca
```

### Subtitle (30 chars max)
```
Organize sua pelada
```

### Promotional Text (170 chars max, editável sem nova versão)
```
Convide jogadores, confirme presenças, sorteie times e acompanhe rankings em um único app.
```

### Description (4000 chars max)
```
Convoca ajuda grupos esportivos a organizar jogos, confirmar presenças, sortear times, registrar estatísticas e acompanhar rankings.

Ideal para administradores de peladas, futebol society, futsal e grupos recorrentes, o app centraliza a rotina do grupo em uma experiência simples para celular.

Principais recursos:

• Criação e gestão de grupos — crie seu grupo, adicione membros e convide por link
• Eventos recorrentes — agende jogos com data, horário, local e limite de vagas
• Lista de presença e espera — jogadores confirmam pelo app; lista de espera automática quando lota
• Check-in no dia do jogo — controle quem realmente compareceu
• Sorteio equilibrado de times — monte os times de forma justa e aleatória
• Registro de gols, assistências e cartões — acompanhe o placar em tempo real
• Rankings e estatísticas — veja quem são os artilheiros, garçons e MVPs
• Controle financeiro do grupo — mensalidades, diárias, despesas e cobranças
• Notificações push — receba avisos de novos eventos e convocações
• Convites por link — compartilhe e novos membros entram com um toque

O Convoca foi pensado para grupos que querem menos trabalho administrativo e mais organização no dia do jogo.

Desenvolvido por Uzz.Ai Ltda.
```

### Keywords (100 chars max, separados por vírgula)
```
pelada,futebol,futsal,society,times,ranking,convocação,esporte,jogadores,sorteio
```

### Support URL
```
https://convoca.uzzai.com.br/suporte
```

### Marketing URL (opcional)
```
https://convoca.uzzai.com.br/produto-convoca
```

### Privacy Policy URL
```
https://convoca.uzzai.com.br/privacidade
```

---

## 4. App Review Information (Informações para Revisão)

### Demo Account
| Campo | Valor |
|-------|-------|
| **Sign-in required** | Yes |
| **User name** | `demo.review@convoca.uzzai.com.br` |
| **Password** | `ConvocaDemo2026` |

### Review Notes (copie inteiro — versao atualizada 2026-06-27)
```
This is a sports group management app (soccer/futsal) for Brazilian players.

After signing in with the demo account, you will see a dashboard with:
- A group called "Pelada dos Cracks" with 10 members
- An upcoming event with 11 confirmed players

Main flows to test:
1. Dashboard → tap the group → see members and upcoming events
2. Tap the event → see confirmed players, event details
3. Rankings tab → see player rankings
4. Profile → manage account, privacy settings, account deletion

ACCOUNT DELETION: Users can delete their account directly in-app at
Profile → "Privacidade e conta" → "Excluir minha conta" → confirm.
The deletion is immediate and does not require email.

FINANCIAL FEATURE NOTE: The "Pagamentos" (Payments) section is a
bookkeeping/record-keeping tool only. It helps group organizers track
who has paid for real-world expenses (field rental, equipment, monthly
dues). The app does NOT process any payments — actual payments happen
outside the app via bank transfer (PIX), cash, or other offline methods.
No digital content is sold, no subscriptions exist, and no payment
gateway is integrated. This falls under App Review Guidelines 3.1.3(e)
— goods and services consumed outside the app.

The app loads a live web URL (https://convoca.uzzai.com.br) in a native
WebView container (Capacitor) with native push notifications (APNs/FCM).
This is the standard architecture for hybrid apps.

No special configuration or external hardware is needed.
```

### Contact Information
| Campo | Valor |
|-------|-------|
| **First Name** | Pedro Vitor |
| **Last Name** | Pagliarin |
| **Email** | ppagliarin@gmail.com |
| **Phone** | (preencher com seu telefone) |

---

## 5. App Privacy (Privacy Nutrition Labels)

A Apple exige que você declare os tipos de dados coletados. Preencha no App Store Connect em **App Privacy**.

### Pergunta 1: "Do you or your third-party partners collect data from this app?"
→ **Yes**

### Pergunta 2: Tipos de dados coletados

Marque cada categoria abaixo e preencha os detalhes:

#### Contact Info
| Subitem | Coletado? | Uso | Linked to User? | Tracking? |
|---------|-----------|-----|-----------------|-----------|
| **Name** | ✅ Yes | App Functionality | Yes | No |
| **Email Address** | ✅ Yes | App Functionality | Yes | No |

#### Identifiers
| Subitem | Coletado? | Uso | Linked to User? | Tracking? |
|---------|-----------|-----|-----------------|-----------|
| **User ID** | ✅ Yes | App Functionality | Yes | No |
| **Device ID** | ✅ Yes | App Functionality (push token) | Yes | No |

#### Usage Data
| Subitem | Coletado? | Uso | Linked to User? | Tracking? |
|---------|-----------|-----|-----------------|-----------|
| **Product Interaction** | ✅ Yes | App Functionality, Analytics | Yes | No |

#### Diagnostics
| Subitem | Coletado? | Uso | Linked to User? | Tracking? |
|---------|-----------|-----|-----------------|-----------|
| **Crash Data** | ✅ Yes | App Functionality | No | No |
| **Performance Data** | ✅ Yes | App Functionality | No | No |

### NÃO marcar (não coletamos):
- ❌ Financial Info (pagamentos ficam internos, sem gateway)
- ❌ Location (GPS não é coletado)
- ❌ Health & Fitness
- ❌ Contacts (agenda)
- ❌ Browsing History
- ❌ Search History
- ❌ Purchases
- ❌ Photos or Videos
- ❌ Sensitive Info
- ❌ Other Data

### Pergunta 3: "Do you or your third-party partners use data for tracking?"
→ **No**

### Pergunta 4: "Does this app sell data?"
→ **No**

---

## 6. Content Rating (Age Rating)

Responda tudo como "None" ou "No":

| Pergunta | Resposta |
|----------|----------|
| Cartoon or Fantasy Violence | None |
| Realistic Violence | None |
| Prolonged Graphic Violence | None |
| Sexual Content | None |
| Graphic Sexual Content | None |
| Profanity or Crude Humor | None |
| Mature/Suggestive Themes | None |
| Horror/Fear Themes | None |
| Medical/Treatment Information | None |
| Alcohol, Tobacco, or Drug Use | None |
| Simulated Gambling | None |
| Real-Money Gambling | None |
| Contests | None |
| Unrestricted Web Access | **No** (WebView carrega apenas convoca.uzzai.com.br — URL controlada, sem navegacao livre) |
| Made for Kids | **No** |

→ Resultado esperado: **4+**

---

## 7. Screenshots

Pasta: `C:\Users\pedro\convoca-screenshots\APP_STORE\SELECIONADAS\`

| Ordem | Arquivo | Tela | Dimensão |
|-------|---------|------|----------|
| 1 | `01_hero.png` | Página de marketing — proposta de valor | 1320×2868 |
| 2 | `02_dashboard.png` | Dashboard com grupo e próximo evento | 1320×2868 |
| 3 | `03_grupo.png` | Página do grupo com membros | 1320×2868 |
| 4 | `04_evento.png` | Evento com detalhes e confirmações | 1320×2868 |
| 5 | `05_rankings.png` | Ranking dos jogadores | 1320×2868 |
| 6 | `06_login.png` | Tela de login | 1320×2868 |

Formato: iPhone 6.9" (iPhone 16 Pro Max) — obrigatório no App Store Connect.

> **Nota:** Se a Apple pedir screenshot de 6.7" (1290×2796) ou 6.5" (1284×2778) também, avise que geramos rapidamente com viewport ajustado.

---

## 8. App Icon

Usar o mesmo ícone 1024×1024 sem transparência e sem cantos arredondados (a Apple aplica a máscara automaticamente).

Arquivo: `assets/icon-512.png` — escalar para 1024×1024 se necessário, ou usar o PNG do `assets/icon.png` original.

> ⚠️ A Apple exige que o ícone NÃO tenha transparência (alpha channel). Se o PNG tiver fundo transparente, adicione fundo branco ou verde antes de enviar.

---

## 9. Checklist Final — Antes de Clicar "Submit for Review"

- [ ] Build `.ipa` enviada via Xcode/Transporter e associada à versão 1.0.0
- [ ] Screenshots 6.9" (1320×2868) enviadas (6 imagens)
- [ ] Nome, subtitle, description, keywords preenchidos (copiar §3 acima)
- [ ] Privacy Policy URL: `https://convoca.uzzai.com.br/privacidade`
- [ ] Support URL: `https://convoca.uzzai.com.br/suporte`
- [ ] App Privacy preenchido (copiar §5 acima)
- [ ] Content Rating preenchido (copiar §6 acima)
- [ ] Demo account informada (copiar §4 acima)
- [ ] Review Notes preenchidas (copiar §4 acima)
- [ ] Pricing: Free
- [ ] Ícone 1024×1024 sem transparência

---

## 10. Account Deletion (Obrigatório desde 2022)

A Apple exige que apps que permitem criar conta ofereçam exclusão **dentro do app**.

✅ Já implementado:
- Dentro do app: `/profile` → Privacidade e conta → Excluir conta
- URL pública: `https://convoca.uzzai.com.br/excluir-conta`

No App Store Connect, em **App Information → Account Deletion**:
- "Users can delete their account" → **Yes**
- Link: `https://convoca.uzzai.com.br/excluir-conta`
