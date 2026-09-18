---
confidence: 0.97
sources: [architecture/_index.md, architecture/_index.md, facts/_index.md]
synthesized_at: '2026-05-16T16:17:58.686Z'
type: synthesis
title: Billing changes are constrained by Stripe API compatibility
summary: The multi-plan billing design is tightly coupled to Stripe v21 object-model changes and invoice-status semantics.
tags: [billing, stripe, subscriptions, api]
related: []
keywords: [stripe-v21, invoice-preview, subscription-plans, webhook, plan-id, stripe-price-id, invoice-status, promotion-code]
createdAt: '2026-05-16T16:17:58.686Z'
updatedAt: '2026-05-16T16:17:58.686Z'
---

# Billing changes are constrained by Stripe API compatibility

Architecture and facts both describe a two-layer billing system: the multi-plan subscription model and the Stripe v21 migration layer. The same invoice and subscription fields changed in Stripe, so billing logic, webhook persistence, and UI state all need to follow the new API shape to stay correct.

## Evidence

- **architecture**: The billing topic has a Stripe SDK compatibility layer with required v21 changes such as invoices.retrieveUpcoming() -> invoices.createPreview(), subscription fields moving to subscription.items.data[0], and invoice.paid changing to invoice.status === "paid".
- **architecture**: The application subscription architecture introduces subscription_plans in migration 006, stores plan_id and stripe_price_id in group_subscriptions, and relies on the Stripe webhook to persist selected plan metadata.
- **facts**: Stripe v21 durable changes include invoices.retrieveUpcoming() -> invoices.createPreview(), Invoice.subscription -> Invoice.parent.subscription_details.subscription, PromotionCode.coupon -> PromotionCode.promotion.coupon, and using invoice.status === "paid".
