---
description: "Convenções para rotas Stripe: webhook signature, lazy singleton getStripe(), parameterized SQL, error handling pt-BR, Stripe v21 breaking changes."
applyTo: "src/app/api/stripe/**"
---

# Convenções Stripe API Routes

## Client

Sempre use `getStripe()` (lazy singleton de `@/lib/stripe`). Nunca instancie `new Stripe()` diretamente.

## Webhook

- Leia o body como `req.text()`, nunca como JSON
- Valide com `getStripe().webhooks.constructEvent(body, sig, secret)` antes de processar
- Retorne `{ received: true }` mesmo em eventos desconhecidos

## Stripe v21

- `invoices.createPreview()` em vez de `retrieveUpcoming()`
- `invoice.parent?.subscription_details?.subscription` em vez de `invoice.subscription`

## Segurança

- `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` são server-only — nunca exponha no client
- Use parameterized SQL (`sql\`...${var}\``) para todas as queries
- Valide IDs e metadata antes de confiar neles

## Error Handling

```typescript
try {
  const user = await requireAuth();
  // ...
} catch (error) {
  if (error instanceof Error && error.message === "Não autenticado") {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  logger.error(error, "Erro na rota Stripe");
  return NextResponse.json({ error: "Erro ao processar" }, { status: 500 });
}
```
