---
children_hash: 251ab6af6eeb0d0242f60d5dd11a38e783886a90806686df9e91451d7f334cae
compression_ratio: 0.5181305398871877
condensation_order: 1
covers: [context.md, provider_migration_diagnosis.md]
covers_token_total: 1241
summary_level: d1
token_count: 643
type: summary
---
# Database Architecture Overview

## Topic: Database
- **Overview**: Focuses on the project database architecture, emphasizing provider-specific coupling, migration readiness, and operational risks.
- **Key Concepts**:
  - Database provider abstraction
  - Authentication data access
  - Schema portability
  - Operational credential risk
- **Related Topics**: See [security/operations](security/operations) for guidance on credential exposure and secret rotation.

## Provider Migration Diagnosis
- **Task**: Document the infrastructure diagnosis regarding database provider migration readiness and authentication/storage dependencies as of March 31, 2026.
- **Key Findings**:
  - The application does not rely on Supabase SDK or storage APIs.
  - Authentication is implemented via NextAuth Credentials using raw SQL against `public.users`.
  - Password reset functionality depends on `users.reset_token` fields and utilizes Resend for email delivery.
  - Local configurations and backup scripts still reference Supabase, posing security risks due to hardcoded credentials.
- **Flow**: 
  - NextAuth credentials login → raw SQL query to `public.users` → signup route inserts into users → password recovery writes reset token → reset-password validates token and updates password → email delivery via Resend.
- **Dependencies**: Authentication relies on `src/lib/auth.ts`, the `users` table, and email sending via `src/lib/email.ts`.
- **Migration Considerations**: 
  - Updating `DATABASE_URL`, migrating schema and data, auditing Supabase references, and rotating exposed credentials are essential for provider migration.
- **Highlights**: The application is largely portable across PostgreSQL providers due to its use of generic SQL access, with migration challenges primarily in environment configuration and legacy scripts. 

## Key Facts
- **Supabase SDK Usage**: The app does not use Supabase SDK for authentication or storage.
- **Authentication Implementation**: NextAuth Credentials access `public.users` with raw SQL.
- **Signup Flow**: User creation occurs via `src/app/api/auth/signup/route.ts`.
- **Password Recovery**: Utilizes `reset_token` for recovery and sends emails through Resend.
- **Database Client**: Access is managed through a generic PostgreSQL library.
- **Migration Steps**: Involves changing `DATABASE_URL` and migrating schema/data.
- **PostgreSQL Features**: The schema employs standard features like `uuid-ossp`, `JSONB`, and triggers.
- **Legacy Scripts**: Backup scripts referencing Supabase remain in the project and require updates.