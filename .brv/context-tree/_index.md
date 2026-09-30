---
children_hash: efc4168d49702461fcb1b072c51d5c6069dbf16ae6cd79668256fa3f943fa086
compression_ratio: 0.30888575458392104
condensation_order: 3
covers: [architecture/_index.md, facts/_index.md, security/_index.md]
covers_token_total: 2127
summary_level: d3
token_count: 657
type: summary
---
# Structural Summary of Knowledge Entries

## Architecture Overview
The architecture focuses on billing and database portability, highlighting significant changes in the Stripe v21 API and credential management across domains.

### Billing System
- **Key Changes**: 
  - **Invoice API**: Renamed from `invoices.retrieveUpcoming()` to `invoices.createPreview()`.
  - **Subscription Management**: Fields `current_period_start` and `current_period_end` moved to `SubscriptionItem`.
  - **Promotion Codes**: Structure changed from `PromotionCode.coupon` to `PromotionCode.promotion.coupon`.
- **Migration**: Implementation of a multi-plan subscription system documented in `architecture/billing/multi_plan_subscription_system.md`.

### Database Architecture
- **Provider Abstraction**: Ensures flexibility across different database providers.
- **Migration Readiness**: Emphasizes updating `DATABASE_URL` and cleaning hardcoded credentials.
- **Key Findings**: Authentication via NextAuth Credentials, not relying on Supabase SDK.

### Credential Management
- **Security Risks**: Hardcoded credentials in backup scripts pose significant security threats, requiring rotation during migrations.

## Project Knowledge Summary
The project knowledge encapsulates essential facts about the Peladeiros infrastructure and implementation choices.

### Key Concepts
- **Authentication**: Utilizes NextAuth Credentials with custom flows for user management.
- **Database Management**: Access through a generic PostgreSQL library; migration involves schema/data transfer.
- **Legacy Scripts**: Existing scripts contain hardcoded credentials needing updates.

### Notable Entries
- **Exportação de PDF Mobile**: Solutions for mobile PDF export using the Web Share API.
- **Peladeiros Billing and Stripe Facts**: Consolidates billing architecture facts, including Stripe v21 migration.

## Security Overview
The security domain emphasizes operational security, focusing on credential management and exposure risks.

### Key Points
- **Credential Management**: Effective management is critical during migrations; hardcoded credentials must be rotated.
- **Operational Security**: Focuses on secret handling and remediation of credential exposure risks.

### Operations
- **Backup Credential Exposure**: Identifies risks in backup scripts, recommending rotation of hardcoded credentials post-migration.

### Conclusion
The knowledge entries collectively emphasize the importance of secure credential management, effective billing architecture, and database portability, with detailed documentation for operational practices and migration strategies.