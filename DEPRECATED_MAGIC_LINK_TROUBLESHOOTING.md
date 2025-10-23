# Troubleshooting Magic Link Authentication

Este documento fornece soluções para problemas comuns com autenticação via Magic Link no Peladeiros.

## Problema: "Erro ao enviar link de login"

### Causa 1: Ad Blocker ou Extensões de Navegador

O erro mais comum é causado por ad blockers ou extensões de privacidade que bloqueiam requisições para domínios de autenticação.

**Sintomas:**
- Mensagem "Erro ao enviar link de login. Tente novamente."
- Erro no console do navegador: `ERR_BLOCKED_BY_CLIENT`
- Requisições bloqueadas para `api.stack-auth.com`

**Solução:**
1. **Desabilite ad blockers** para o site Peladeiros
2. **Adicione à whitelist** os seguintes domínios:
   - `api.stack-auth.com`
   - `app.stack-auth.com`
3. **Tente em modo anônimo/privado** do navegador (geralmente desabilita extensões)
4. **Use outro navegador** temporariamente para testar

### Causa 2: Problemas de Rede

**Sintomas:**
- Timeout ao tentar fazer login
- Erro de conexão

**Solução:**
1. Verifique sua conexão com a internet
2. Tente desabilitar VPN temporariamente
3. Verifique se seu firewall corporativo não está bloqueando os domínios do Stack Auth

### Causa 3: Configuração do Stack Auth

**Sintomas:**
- Erro persistente mesmo sem ad blockers
- Erro 401 ou 403

**Solução:**
1. Verifique se as variáveis de ambiente estão configuradas corretamente:
   ```bash
   NEXT_PUBLIC_STACK_PROJECT_ID=...
   NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=...
   STACK_SECRET_SERVER_KEY=...
   ```
2. Confirme que o projeto Stack Auth está ativo no [painel do Stack](https://app.stack-auth.com)
3. Verifique se o magic link está habilitado no projeto

## Problema: Magic Link não chega no email

**Possíveis causas:**
1. Email foi para pasta de spam/lixeira
2. Email digitado incorretamente
3. Configuração de email no Stack Auth

**Solução:**
1. Verifique a pasta de spam
2. Confirme que digitou o email corretamente
3. Tente com outro provedor de email (Gmail, Outlook, etc.)
4. Aguarde alguns minutos - pode haver atraso na entrega

## Problema: Magic Link expirou

**Sintoma:**
- Mensagem de erro ao clicar no link

**Solução:**
1. Links mágicos têm validade limitada (geralmente 10-15 minutos)
2. Solicite um novo magic link
3. Clique no link assim que receber o email

## Testando a Configuração

Para verificar se tudo está funcionando corretamente:

1. **Abra o console do navegador** (F12)
2. **Acesse** `/auth/signin`
3. **Digite um email** e clique em "Entrar com Magic Link"
4. **Verifique os logs**:
   - ✅ **Sucesso**: Mensagem "Link mágico enviado! Verifique seu email."
   - ❌ **Erro**: Veja os detalhes do erro no console

## Rotas do Stack Auth

O sistema usa as seguintes rotas para autenticação:

- `/handler/sign-in` - Página de login
- `/handler/sign-up` - Página de cadastro
- `/handler/magic-link-callback` - Callback do magic link
- `/handler/account-settings` - Configurações da conta
- `/auth/signin` - Página de login customizada (Peladeiros)

## Suporte

Se o problema persistir após seguir este guia:

1. **Limpe cache e cookies** do navegador
2. **Reinicie o navegador**
3. **Tente em outro dispositivo** para confirmar se é problema local
4. **Verifique o status** do Stack Auth em [https://status.stack-auth.com](https://status.stack-auth.com)

## Para Desenvolvedores

### Verificando Logs

Execute o projeto em modo de desenvolvimento:

```bash
npm run dev
```

Verifique os logs no terminal e no console do navegador para mais detalhes sobre erros.

### Variáveis de Ambiente

Confirme que todas as variáveis estão configuradas:

```bash
# .env.local
NEXT_PUBLIC_STACK_PROJECT_ID=1bc505ea-b01d-44d6-af8d-c1fd464802d0
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=pck_...
STACK_SECRET_SERVER_KEY=ssk_...
```

### Testando Handler Route

Verifique se a rota handler está funcionando:

```bash
curl http://localhost:3000/handler/health
```

Deve redirecionar para `/auth/signin`.

### Build de Produção

Sempre teste o build antes de fazer deploy:

```bash
npm run build
npm start
```
