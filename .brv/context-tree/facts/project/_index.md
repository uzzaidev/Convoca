---
children_hash: e11e82ff22440c4bd2ac62baa40c4f5e7c0da5345a55f1c2324af924e07c3d04
compression_ratio: 0.13282132369550487
condensation_order: 1
covers: [context.md, exporta_o_de_pdf_mobile_e_resili_ncia_do_agente_de_ia.md, extracted_project_facts.md, peladeiros_billing_and_stripe_facts.md, peladeiros_infrastructure_facts_2026_03_31.md, project_facts.md, rlm_curate_workflow_facts.md, stripe_group_deletion_facts.md]
covers_token_total: 4427
summary_level: d1
token_count: 588
type: summary
---
# Structural Summary of Knowledge Entries

## Project Overview
- Captures point-in-time factual statements about Peladeiros infrastructure and implementation choices.
- Key concepts include:
  - **supabase_sdk_usage**
  - **auth_implementation**
  - **signup_flow**
  - **password_recovery**
  - **database_client**
  - **provider_migration**
  - **postgres_features**
  - **legacy_backup_scripts**
  - **hardcoded_backup_credentials**
- Related topics: 
  - **architecture/database** - detailed migration diagnosis
  - **security/operations** - secret exposure risk

## Exportação de PDF Mobile e Resiliência do Agente de IA
- Documents solutions for bugs in mobile PDF export using Web Share API and resilience in streaming for OpenAI's IA agent.
- Highlights integration practices for resilience.

## Extracted Project Facts
- Curates factual statements extracted from project context.
- Serves as a collection of key facts for future reference.

## Peladeiros Billing and Stripe Facts
- Captures durable project facts related to billing and Stripe integration.
- Key changes include:
  - Migration facts for Stripe v21
  - Multi-plan subscription architecture
  - Windows SWC build diagnostics
- Highlights include:
  - API path changes and billing architecture details.

## Peladeiros Infrastructure Facts (2026-03-31)
- Records factual statements from infrastructure diagnosis.
- Key facts:
  - No Supabase SDK usage in auth/storage.
  - Custom authentication flows using NextAuth Credentials.
  - Database access through generic PostgreSQL library.
  - Existence of hardcoded credentials in backup scripts.

## Project Facts
- Consolidates high-level project facts including:
  - **database**: PostgreSQL with portable features.
  - **billing**: Multi-plan subscriptions with optional planId.
  - **authentication**: Custom flows using NextAuth Credentials.
  - **documentation_structure**: Organized into domain docs.
- Captures key entities and operational rules.

## RLM Curate Workflow Facts
- Merges details from overlapping files documenting RLM curation workflow constraints.

## Stripe Group Deletion Facts
- Details the deletion process for groups and associated Stripe subscriptions.
- Highlights:
  - Soft-deleting a group requires canceling active subscriptions.
  - API endpoints involved in group deletion and billing implications.