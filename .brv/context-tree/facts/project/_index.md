---
children_hash: ddac37a2552557aa37c816dad810c0bea0712c72c2561a77f6596efadbc4ccc8
compression_ratio: 0.12200040330711837
condensation_order: 1
covers: [context.md, curate_workflow_rlm_approach.md, peladeiros_billing_and_stripe_facts.md, peladeiros_infrastructure_facts_2026_03_31.md, project_facts.md, rlm_curate_workflow_facts.md]
covers_token_total: 4959
summary_level: d1
token_count: 605
type: summary
---
## Project Overview

### Key Concepts
- **Infrastructure and Implementation**: Focus on Peladeiros infrastructure, including Supabase SDK usage, authentication, and database client configurations.
- **Billing and Stripe Integration**: Details on Stripe v21 migration, multi-plan subscription architecture, and billing diagnostics.
- **Authentication and Database Portability**: Use of NextAuth Credentials, PostgreSQL features, and provider migration strategies.

### Related Topics
- **Architecture/Database**: Migration diagnosis and database portability.
- **Security/Operations**: Secret exposure risks and backup credential management.

## RLM Curation Workflow

### Workflow Structure
- **Single-Pass Processing**: Utilizes precomputed recon results for small contexts, focusing on extraction and organization before curation.
- **Verification**: Relies on result.applied[].filePath for verification, avoiding raw context printing and repeated recon calls.

### Dependencies
- **Tools**: Uses tools.curation.recon, tools.curation.mapExtract, and tools.curate for processing.
- **Task Constraints**: Emphasizes single-pass mode and verification through applied file paths.

## Peladeiros Billing and Infrastructure Facts

### Billing and Stripe Facts
- **API Changes**: Stripe v21 updates, including method renames and field relocations.
- **Subscription Architecture**: Multi-plan support with optional planId and fallback mechanisms.

### Infrastructure Facts
- **Auth and Database**: Custom auth flows with NextAuth, generic PostgreSQL access, and exposed credentials in backup scripts.
- **Backup and Migration**: Legacy Supabase backup scripts and provider migration strategies.

## Project Facts and Documentation

### Project Knowledge
- **Core Stack**: Includes PostgreSQL, Stripe v21, and Resend, with a focus on database portability and authentication flows.
- **Documentation Structure**: Organized into domain-specific entries rather than a monolithic README.

### Key Entities and Files
- **Entities**: Subscription plans, group subscriptions, and public.users.
- **Files**: Includes src/db/client.ts, backup scripts, and key API routes for billing and authentication.

## Summary

This summary consolidates high-level project facts, RLM curation workflows, and infrastructure details, emphasizing key architectural decisions and relationships across billing, authentication, and database management.