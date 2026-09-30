---
children_hash: c9db83f1cb6b1f74afa20e072046c015f6e7d105ee3007d6b39e2ced666e15fb
compression_ratio: 0.37558062375580625
condensation_order: 2
covers: [context.md, credential-management-across-domains.md, credential-management-risks.md, database-portability-and-secret-hygiene.md, operations/_index.md]
covers_token_total: 1507
summary_level: d2
token_count: 566
type: summary
---
## Domain: Security

### Purpose
Operational security knowledge focusing on secret handling, credential exposure, and mitigation actions.

### Scope
**Included:**
- Credential management risks
- Secret rotation requirements
- Operational script security
- Exposure remediation notes

**Excluded:**
- Feature authorization logic
- User-facing security guidance

### Ownership
Managed by Peladeiros engineering.

### Usage
For documenting security-relevant operational findings and remediation constraints.

---

## Credential Management Across Domains
Effective credential management is vital for operational security and database migrations.

### Key Points
- Hardcoded credentials in backup scripts pose security risks, necessitating their rotation during migrations.
- Operational leftovers and exposed secrets in backup tooling are significant blockers.

---

## Credential Management Risks
Secure credential management is essential during database migrations.

### Key Points
- Hardcoded credentials in backup scripts require rotation to maintain security.
- Both architecture and security domains emphasize the importance of effective credential management.

---

## Database Portability and Secret Hygiene
Maintaining database portability necessitates attention to secret hygiene during migrations.

### Key Points
- Cleanup of hardcoded secrets is crucial for secure database migrations.
- Risks associated with operational credentials must be addressed to ensure security.

---

## Operations Overview
Tracks operational security findings related to credentials and scripts for infrastructure maintenance and migration.

### Key Concepts
- Hardcoded secrets
- Backup scripts
- Credential rotation
- Provider migration risk

### Backup Credential Exposure
Documents credential exposure risks in backup scripts identified during infrastructure reviews.

### Key Points
- Hardcoded credentials in backup scripts linked to provider migration must be rotated post-migration.
- Risk mitigation involves replacing static secrets with environment-based injection or secret management.

### Facts
- Backup scripts for Supabase and Neon contain hardcoded credentials.
- Credential rotation is recommended after any migration due to exposed secrets in backup scripts.