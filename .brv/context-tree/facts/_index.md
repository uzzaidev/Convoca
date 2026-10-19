---
children_hash: e4850544c411927ff2ec26df8195611c212b6884bfa56a8acfe22341a9e76f8d
compression_ratio: 0.7451923076923077
condensation_order: 2
covers: [context.md, project/_index.md]
covers_token_total: 832
summary_level: d2
token_count: 620
type: summary
---
# Structural Summary of Knowledge Entries

## Domain: Facts
- **Purpose**: Provides standalone project facts for quick recall.
- **Scope**:
  - **Included**: Technology choices, environment facts, operational facts, stable implementation details.
  - **Excluded**: Long-form design rationale, user-facing documentation.
- **Ownership**: Peladeiros engineering.
- **Usage**: High-signal factual recall about the project.

## Project Overview
- Captures factual statements about Peladeiros infrastructure and implementation choices.
- **Key Concepts**:
  - `supabase_sdk_usage`
  - `auth_implementation`
  - `signup_flow`
  - `password_recovery`
  - `database_client`
  - `provider_migration`
  - `postgres_features`
  - `legacy_backup_scripts`
  - `hardcoded_backup_credentials`
- **Related Topics**: 
  - `architecture/database` - Migration diagnosis.
  - `security/operations` - Secret exposure risks.

## Exportação de PDF Mobile e Resiliência do Agente de IA
- Documents solutions for mobile PDF export bugs and resilience in streaming for OpenAI's IA agent, highlighting integration practices.

## Extracted Project Facts
- Curates factual statements for future reference.

## Peladeiros Billing and Stripe Facts
- Captures project facts related to billing and Stripe integration.
- **Key Changes**:
  - Migration facts for Stripe v21.
  - Multi-plan subscription architecture.
  - Windows SWC build diagnostics.
- **Highlights**: API path changes and billing architecture details.

## Peladeiros Infrastructure Facts (2026-03-31)
- Records infrastructure diagnosis facts.
- **Key Facts**:
  - No Supabase SDK usage in auth/storage.
  - Custom authentication flows using NextAuth Credentials.
  - Database access via generic PostgreSQL library.
  - Hardcoded credentials in backup scripts.

## Project Facts
- Consolidates high-level project facts:
  - **Database**: PostgreSQL with portable features.
  - **Billing**: Multi-plan subscriptions with optional planId.
  - **Authentication**: Custom flows using NextAuth Credentials.
  - **Documentation Structure**: Organized into domain docs.

## RLM Curate Workflow Facts
- Merges details from overlapping files documenting RLM curation workflow constraints.

## Stripe Group Deletion Facts
- Details the deletion process for groups and associated Stripe subscriptions.
- **Highlights**:
  - Soft-deleting a group requires canceling active subscriptions.
  - API endpoints involved in group deletion and billing implications.