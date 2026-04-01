---
title: Stripe V21 API Migration
tags: []
related: [architecture/billing/multi_plan_subscription_system.md, facts/project/peladeiros_billing_and_stripe_facts.md]
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: '2026-04-01T14:38:31.874Z'
updatedAt: '2026-04-01T14:38:31.874Z'
---
## Raw Concept
**Task:**
Document critical Stripe v21 API changes affecting billing and subscription code paths

**Changes:**
- Renamed invoices.retrieveUpcoming() to invoices.createPreview()
- Moved current_period_start and current_period_end from Subscription to SubscriptionItem
- Changed Invoice.subscription access path to Invoice.parent.subscription_details.subscription
- Changed PromotionCode.coupon to PromotionCode.promotion.coupon
- Removed invoice.paid in favor of invoice.status === "paid"
- Marked hosted_invoice_url as potentially undefined
- Changed Invoice.status typing to a Status enum

**Flow:**
Stripe SDK upgrade -> identify breaking API changes -> update invoice and subscription access paths -> adjust nullability and enum handling -> keep billing logic compatible

**Timestamp:** 2026-04-01

**Patterns:**
- `^paid$` - Expected invoice status value when replacing invoice.paid checks

## Narrative
### Structure
This topic captures the compatibility changes required after upgrading to stripe@21.x.x. The main impact areas are invoice preview generation, subscription period access, invoice metadata traversal, promotion code shape changes, and stricter typing for invoice status fields.

### Dependencies
Applies to code paths that use Stripe invoice retrieval, invoice preview generation, promotion code lookup, subscription lifecycle displays, and TypeScript type checks around Stripe responses.

### Highlights
Stripe v21 replaces invoices.retrieveUpcoming() with invoices.createPreview(). Subscription billing periods now come from subscription.items.data[0], invoice.paid is removed, and hosted_invoice_url must be treated as nullable.

### Rules
1. Use invoices.createPreview() instead of invoices.retrieveUpcoming().
2. Read current_period_start and current_period_end from subscription.items.data[0].
3. Access the subscription reference through Invoice.parent.subscription_details.subscription.
4. Access coupons through PromotionCode.promotion.coupon.
5. Replace invoice.paid checks with invoice.status === "paid".
6. Normalize hosted_invoice_url with ?? null when needed.
7. Cast Invoice.status appropriately when string semantics are required.

### Examples
Example migration points: replace old preview calls with invoices.createPreview(); read billing cycle dates from subscription.items.data[0]; compare invoice.status to "paid" instead of reading invoice.paid.

## Facts
- **stripe_invoice_preview_method**: stripe@21.x.x renamed invoices.retrieveUpcoming() to invoices.createPreview(). [project]
- **stripe_subscription_period_fields**: In stripe@21.x.x, current_period_start and current_period_end moved from Subscription to SubscriptionItem and should be accessed via subscription.items.data[0]. [project]
- **stripe_invoice_subscription_field**: In stripe@21.x.x, Invoice.subscription moved to Invoice.parent.subscription_details.subscription. [project]
- **stripe_promotion_coupon_field**: In stripe@21.x.x, PromotionCode.coupon moved to PromotionCode.promotion.coupon. [project]
- **stripe_invoice_paid_check**: In stripe@21.x.x, invoice.paid was removed and invoice.status === "paid" should be used instead. [project]
- **stripe_hosted_invoice_url_nullability**: In stripe@21.x.x, hosted_invoice_url can be undefined and should use ?? null. [project]
- **stripe_invoice_status_type**: In stripe@21.x.x, Invoice.status is a Status enum rather than a plain string and may need casting as string | null. [project]
