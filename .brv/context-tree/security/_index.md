---
children_hash: e0ed199d224dd29e5f47a3b2f854a295a9fef3303b9a38a85807a1abc1fee0c7
compression_ratio: 0.4688995215311005
condensation_order: 2
covers: [context.md, operations/_index.md, provider-portability-depends-on-secrets-hygiene.md]
covers_token_total: 1254
summary_level: d2
token_count: 588
type: summary
---
# d2 Structural Summary

## Security / Operations
This branch centers on **operational security risks** tied to provider migration and maintenance scripts. The key concern is not application-layer authorization, but **exposed credentials in backup tooling** and the resulting need for rotation and cleanup.

### `context.md`
Defines the **security domain** as a place for:
- credential management risks
- secret rotation requirements
- operational script security
- exposure remediation notes

It explicitly excludes:
- feature authorization logic
- user-facing security guidance

Ownership is **Peladeiros engineering**, and the domain is meant for security-relevant operational findings and remediation constraints.

### `operations/_index.md`
Provides the main operational security topic: **hardcoded secrets in backup scripts**.

Key points:
- Backup scripts for **Supabase** and **Neon** contain embedded credentials.
- Risk is documented across:
  - `src/db/backup-supabase.sh`
  - `src/db/backup-supabase.bat`
- The flow is:
  **infrastructure review -> inspect backup scripts -> detect embedded credentials -> treat as exposure risk -> rotate credentials after migration**
- Mitigation depends on:
  - finding every script with embedded credentials
  - replacing static secrets with environment injection or secret management
  - rotating affected database users/passwords
- The rule is explicit: **hardcoded credentials in operational scripts must be treated as exposed secrets and rotated after migration or audit discovery.**

Drill down to `backup_credential_exposure.md` for the concrete exposure finding and remediation constraint.

## Cross-cutting synthesis
### `provider-portability-depends-on-secrets-hygiene.md`
This synthesis ties architecture, facts, and security together:

- The application is **largely PostgreSQL-portable** at runtime.
- Migration risk is not just schema/data portability; it also includes **secret hygiene**.
- Residual coupling remains in:
  - local `.env` values pointing `DATABASE_URL` at a **Supabase host**
  - legacy backup scripts with **hardcoded Supabase/Neon credentials**
- The conclusion is that **provider portability depends on secrets cleanup and rotation**, not only on database abstraction.

Use this entry as the bridge between architectural portability and operational security remediation.