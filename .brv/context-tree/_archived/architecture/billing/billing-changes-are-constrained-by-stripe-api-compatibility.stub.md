---
evicted_at: '2026-09-18T10:37:19.390Z'
evicted_importance: 50
original_path: architecture/billing/billing-changes-are-constrained-by-stripe-api-compatibility.md
original_token_count: 444
points_to: _archived/architecture/billing/billing-changes-are-constrained-by-stripe-api-compatibility.full.md
type: archive_stub
---
The billing system is intricately linked to the Stripe v21 API, necessitating updates to the multi-plan subscription model and invoice-status semantics. Key changes in the Stripe API, such as the transition from `invoices.retrieveUpcoming()` to `invoices.createPreview()`, and modifications in subscription fields, require adjustments in billing logic, webhook persistence, and UI states to maintain accuracy. The architecture includes a Stripe SDK compatibility layer that incorporates these changes, while the application’s subscription architecture introduces `subscription_plans` and stores `plan_id` and `stripe_price_id` in `group_subscriptions`. Additionally, the system relies on Stripe webhooks to maintain selected plan metadata, ensuring alignment with the new API structure.