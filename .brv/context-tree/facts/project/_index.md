---
children_hash: e032a45cd7bbcfe7399f97274ed3f6980f815656f8d8eed61bbad7ad10aeadd4
compression_ratio: 0.1500501002004008
condensation_order: 1
covers: [context.md, exporta_o_de_pdf_mobile_e_resili_ncia_do_agente_de_ia.md, extracted_project_facts.md, peladeiros_billing_and_stripe_facts.md, peladeiros_infrastructure_facts_2026_03_31.md, project_facts.md, rlm_curate_workflow_facts.md]
covers_token_total: 3992
summary_level: d1
token_count: 599
type: summary
---
# Project Knowledge Summary

## Overview
The project knowledge captures key facts about the Peladeiros infrastructure, implementation choices, and various operational aspects, providing a structured overview for future reference.

## Key Concepts
- **Supabase SDK Usage**: The application does not utilize the Supabase SDK for authentication or storage.
- **Authentication Implementation**: Uses NextAuth Credentials with custom flows for signup and password recovery.
- **Database Client**: Access is managed through a generic PostgreSQL library.
- **Provider Migration**: Migration involves changing the DATABASE_URL and transferring schema/data.
- **Legacy Backup Scripts**: Existing scripts contain hardcoded credentials that require rotation post-migration.

## Related Topics
- **Architecture/Database**: Detailed migration diagnosis related to database management.
- **Security/Operations**: Risks associated with credential exposure in backup tools.

## Notable Entries
- **Exportação de PDF Mobile e Resiliência do Agente de IA**: Documents solutions for mobile PDF export using the Web Share API and resilience strategies for the OpenAI agent.
- **Extracted Project Facts**: Curated collection of factual statements from the project context, providing a foundation for future recall.
- **Peladeiros Billing and Stripe Facts**: Consolidates billing architecture facts, including Stripe v21 migration details and subscription management.
- **Peladeiros Infrastructure Facts (2026-03-31)**: Records infrastructure diagnostics, emphasizing the absence of SDK coupling and the use of custom authentication flows.
- **Project Facts**: Captures overarching project facts, including tech stack, database portability, and documentation structure.

## Highlights
- The project employs PostgreSQL for its database, ensuring portability across different providers.
- Billing architecture supports multi-plan subscriptions with fallback mechanisms for Stripe pricing.
- Authentication flows are designed to be flexible and secure, utilizing custom logic for user management.
- Documentation is organized into domain-specific entries rather than a single monolithic document, enhancing clarity and accessibility.

## Dependencies
- The knowledge entries depend on the integrity of referenced files and scripts, ensuring they reflect the current state of the system as of their respective timestamps.