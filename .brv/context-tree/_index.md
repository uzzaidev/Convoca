---
children_hash: b284864114466536dad37c87bb0bd49a0779f5f202b775a627940b908b613b6d
compression_ratio: 0.2522163120567376
condensation_order: 3
covers: [architecture/_index.md, facts/_index.md, security/_index.md]
covers_token_total: 2256
summary_level: d3
token_count: 569
type: summary
---
# Structural Summary of Knowledge Entries

## Architecture Overview
### Billing Overview
- **Key Changes**: Updates in the Stripe v21 API affecting invoice handling and subscription management.
  - **Invoice Changes**: API renaming and altered data access paths.
  - **Subscription Management**: Adjustments in subscription fields and promotion code handling.
- **Related Topics**:
  - **Multi Plan Subscription System**: Detailed in `architecture/billing/multi_plan_subscription_system.md`.
  - **Stripe V21 API Migration**: Changes affecting billing paths in `architecture/billing/stripe_v21_api_migration.md`.

### Database Architecture
- **Provider Migration Diagnosis**: 
  - No Supabase SDK usage; authentication via NextAuth with raw SQL.
  - Migration considerations include updating `DATABASE_URL` and auditing references.

### Credential Management
- **Importance**: Effective credential management is crucial during migrations to maintain security.
- **Key Evidence**: Hardcoded credentials in backup scripts pose risks, necessitating rotation.

### Database Portability and Security
- **Focus**: Emphasizes the significance of secret hygiene and portability across PostgreSQL providers.

## Facts Overview
### Domain: Facts
- **Purpose**: Provides standalone project facts for quick recall.
- **Scope**: Includes technology choices and operational facts; excludes long-form documentation.
- **Key Concepts**: Covers various aspects like `supabase_sdk_usage`, `auth_implementation`, and `legacy_backup_scripts`.

### Project Facts
- **Highlights**: Captures key facts related to billing and infrastructure, including migration details and custom authentication flows.

## Security Overview
### Domain: Security
- **Purpose**: Focuses on operational security, secret handling, and credential exposure.
- **Scope**: Includes credential management risks and secret rotation requirements.

### Credential Management Across Domains
- **Key Points**: Hardcoded credentials in backup scripts require rotation to maintain security.

### Operations Overview
- **Focus**: Tracks operational security findings related to credentials and scripts for infrastructure maintenance.
- **Key Concepts**: Hardcoded secrets and credential rotation are critical for secure migrations.